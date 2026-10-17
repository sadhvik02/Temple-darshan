const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");
const Razorpay = require("razorpay");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

// Fetch keys from environment variables (local .env or Firebase functions config)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

/**
 * Helper to get the correct collection name and validate amount
 */
async function getOfferingDetails(sourceType, offeringId, quantity, donationAmount) {
  if (sourceType === "seva") {
    const doc = await db.collection("services").doc(offeringId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Service not found.");
    const price = doc.data().price;
    return { name: doc.data().name, amount: price * quantity };
  } else if (sourceType === "darshan") {
    const doc = await db.collection("darshans").doc(offeringId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Darshan not found.");
    const price = doc.data().price;
    return { name: doc.data().name, amount: price * quantity };
  } else if (sourceType === "donation") {
    const doc = await db.collection("donationTypes").doc(offeringId).get();
    if (!doc.exists) throw new HttpsError("not-found", "Donation type not found.");
    if (!donationAmount || donationAmount < 1) {
      throw new HttpsError("invalid-argument", "Donation amount must be at least ₹1.");
    }
    return { name: doc.data().title, amount: donationAmount };
  } else {
    throw new HttpsError("invalid-argument", "Invalid sourceType.");
  }
}

exports.createPaymentOrder = onCall({ invoker: "public" }, async (request) => {
  const { auth, data } = request;
  
  console.log("createPaymentOrder RECEIVED DATA:", JSON.stringify(data));
  
  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { sourceType, offeringId, quantity, slotId, donationAmount } = data;

  if (!sourceType || !offeringId) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }
  
  const parsedQty = quantity || 1;

  // 1. Calculate trusted amount server-side
  const { name, amount } = await getOfferingDetails(sourceType, offeringId, parsedQty, donationAmount);

  // Free items bypass Razorpay
  if (amount <= 0) {
    throw new HttpsError("invalid-argument", "Amount must be greater than 0 for payments. Free bookings should bypass this.");
  }

  // Razorpay requires amount in paise
  const amountInPaise = amount * 100;

  // 2. Initialize Razorpay
  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });

  // 3. Create Razorpay Order
  const orderOptions = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${auth.uid}_${Date.now()}`.substring(0, 40),
    notes: {
      userId: auth.uid,
      sourceType,
      offeringId,
      slotId: slotId || "N/A"
    }
  };

  let order;
  try {
    order = await razorpay.orders.create(orderOptions);
  } catch (error) {
    console.error("Razorpay Error:", error);
    throw new HttpsError("internal", "Failed to create payment order.");
  }

  // 4. Create pending payment record in Firestore
  const paymentRef = db.collection("payments").doc();
  const paymentData = {
    userId: auth.uid,
    sourceType,
    offeringId,
    offeringName: name,
    quantity: parsedQty,
    slotId: slotId || null,
    amount: amountInPaise,
    amountInr: amount,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "created",
    payload: data || {}, // Store full payload for verifyPayment
    bookingDate: data.bookingDate || null,
    devotees: data.devotees || null,
    devoteeName: data.devoteeName || null,
    devoteePhone: data.devoteePhone || null,
    devoteeEmail: data.devoteeEmail || null,
    donorName: data.donorName || null,
    donorPhone: data.donorPhone || null,
    donorEmail: data.donorEmail || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await paymentRef.set(paymentData);

  // Return non-sensitive details to client
  return {
    orderId: order.id,
    amount: amountInPaise,
    currency: "INR",
    keyId: RAZORPAY_KEY_ID,
    paymentDocId: paymentRef.id
  };
});


/**
 * Atomic Fulfillment for Seva / Darshan Bookings and Donations
 * Can be called by verifyPayment (client-side) or razorpayWebhook (server-side)
 */
async function fulfillPayment(paymentDocId, razorpayPaymentId, razorpaySignature = null, devoteeDetails = null, authUid = null) {
  return await db.runTransaction(async (transaction) => {
    const paymentRef = db.collection("payments").doc(paymentDocId);
    const paymentDoc = await transaction.get(paymentRef);

    if (!paymentDoc.exists) {
      throw new HttpsError("not-found", "Payment record not found.");
    }

    const pData = paymentDoc.data();
    console.log("PAYMENT DOC DATA IN FULFILL:", JSON.stringify(pData));

    // Idempotency check: Already fulfilled
    if (pData.status === "paid") {
      return { success: true, status: "already_paid", bookingRef: pData.bookingRef };
    }

    // If initiated from user callable verifyPayment, ensure ownership
    if (authUid && pData.userId !== authUid) {
      throw new HttpsError("permission-denied", "Payment does not belong to this user.");
    }

    let bookingRefStr = null;

    // 1. Handle Seva/Darshan Slot Capacity & Booking
    if (pData.sourceType === "seva" || pData.sourceType === "darshan") {
      let slotData = null;
      
      if (pData.slotId) {
        const slotRef = db.collection("slots").doc(pData.slotId);
        const slotDoc = await transaction.get(slotRef);
        
        if (!slotDoc.exists) {
          if (pData.slotId.startsWith("auto_")) {
            // Auto slot doesn't exist yet, create it dynamically
            slotData = {
              id: pData.slotId,
              serviceId: pData.offeringId,
              date: pData.bookingDate || "N/A",
              capacity: 50,
              bookedCount: pData.quantity,
              isActive: true,
              startTime: (pData.payload && pData.payload.timeRange) ? pData.payload.timeRange.split(" - ")[0] : "00:00",
              endTime: (pData.payload && pData.payload.timeRange) ? pData.payload.timeRange.split(" - ")[1] : "23:59",
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            };
            
            if (pData.quantity > 50) {
              transaction.update(paymentRef, { status: "refund_needed", razorpayPaymentId: razorpayPaymentId });
              throw new HttpsError("resource-exhausted", "Capacity exceeded.");
            }
            
            transaction.set(slotRef, slotData);
          } else {
            transaction.update(paymentRef, { status: "refund_needed", razorpayPaymentId: razorpayPaymentId });
            throw new HttpsError("failed-precondition", "Slot not found. Refund required.");
          }
        } else {
          slotData = slotDoc.data();
          const currentBooked = slotData.bookedCount || 0;
          const capacity = slotData.capacity || 0;

          // Atomic capacity check
          if (currentBooked + pData.quantity > capacity) {
            transaction.update(paymentRef, { 
              status: "refund_needed", 
              razorpayPaymentId: razorpayPaymentId,
              updatedAt: FieldValue.serverTimestamp()
            });
            throw new HttpsError("resource-exhausted", "Capacity exceeded. Slot is now full. Automatic refund initiated.");
          }

          // Increment bookedCount safely inside transaction
          transaction.update(slotRef, {
            bookedCount: currentBooked + pData.quantity,
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      }

      // Generate Booking Reference
      const timestamp = Date.now().toString();
      bookingRefStr = 'BK-' + timestamp.substring(timestamp.length - 6);

      // Create Booking Record
      const bookingRef = db.collection("bookings").doc();
      const bookingData = {
        userId: pData.userId,
        serviceId: pData.offeringId,
        serviceName: pData.offeringName,
        slotId: pData.slotId,
        bookingRef: bookingRefStr,
        bookingDate: (slotData && slotData.date) ? slotData.date : (pData.bookingDate || "N/A"),
        quantity: pData.quantity,
        status: "confirmed",
        paymentStatus: "paid",
        totalAmount: pData.amountInr,
        sourceType: pData.sourceType,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      if (pData.devotees && Array.isArray(pData.devotees) && pData.devotees.length > 0) {
        bookingData.devotees = pData.devotees.map((dev, idx) => ({
          ...dev,
          devoteeId: `${bookingRefStr}-${idx + 1}`
        }));
      } else if (devoteeDetails) {
        bookingData.devotees = [{
          ...devoteeDetails,
          devoteeId: `${bookingRefStr}-1`
        }];
      } else if (pData.devoteeName) {
        bookingData.devotees = [{
          name: pData.devoteeName,
          phone: pData.devoteePhone || "",
          email: pData.devoteeEmail || "",
          devoteeId: `${bookingRefStr}-1`
        }];
      }

      transaction.set(bookingRef, bookingData);

      // Update Payment Record
      const paymentUpdate = {
        status: "paid",
        razorpayPaymentId: razorpayPaymentId,
        bookingId: bookingRef.id,
        bookingRef: bookingRefStr,
        updatedAt: FieldValue.serverTimestamp()
      };
      if (razorpaySignature) {
        paymentUpdate.razorpaySignature = razorpaySignature;
      }
      transaction.update(paymentRef, paymentUpdate);

    } 
    // 2. Handle Donation Transaction
    else if (pData.sourceType === "donation") {
      const donationRef = db.collection("donations").doc();
      const userDoc = await transaction.get(db.collection("users").doc(pData.userId));
      const userName = userDoc.exists ? userDoc.data().name : "Devotee";
      const userPhone = userDoc.exists ? userDoc.data().phone : "";

      const donationData = {
        userId: pData.userId,
        donationTypeId: pData.offeringId,
        donationTypeName: pData.offeringName,
        amount: pData.amountInr,
        paymentId: paymentRef.id,
        razorpayPaymentId: razorpayPaymentId,
        status: "completed",
        donorName: pData.donorName || userName,
        donorPhone: pData.donorPhone || userPhone,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(donationRef, donationData);

      const paymentUpdate = {
        status: "paid",
        razorpayPaymentId: razorpayPaymentId,
        donationId: donationRef.id,
        updatedAt: FieldValue.serverTimestamp()
      };
      if (razorpaySignature) {
        paymentUpdate.razorpaySignature = razorpaySignature;
      }
      transaction.update(paymentRef, paymentUpdate);
    }

    return { 
      success: true, 
      status: "paid", 
      bookingRef: bookingRefStr 
    };
  });
}

exports.verifyPayment = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDocId, devoteeDetails } = data;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentDocId) {
    console.error("Missing verification data!", JSON.stringify(data));
    throw new HttpsError("invalid-argument", "Missing required verification data.");
  }

  // 1. Verify HMAC Signature
  const generatedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new HttpsError("permission-denied", "Payment signature verification failed.");
  }

  // 2. Fulfill Payment
  return await fulfillPayment(paymentDocId, razorpay_payment_id, razorpay_signature, devoteeDetails, auth.uid);
});

exports.razorpayWebhook = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const webhookSignature = req.headers["x-razorpay-signature"];
  if (!webhookSignature) {
    console.error("Webhook missing x-razorpay-signature header");
    return res.status(400).send("Missing signature header");
  }

  // Verify webhook signature with raw request body
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (expectedSignature !== webhookSignature) {
    console.error("Invalid webhook signature!");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;
  const eventName = event.event;
  console.log(`[Webhook] Event received: ${eventName}`);

  if (eventName === "payment.captured" || eventName === "order.paid") {
    const paymentEntity = (event.payload && event.payload.payment && event.payload.payment.entity)
      ? event.payload.payment.entity
      : null;
    const orderEntity = (event.payload && event.payload.order && event.payload.order.entity)
      ? event.payload.order.entity
      : null;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    if (!orderId) {
      console.warn("[Webhook] No order ID found in payload");
      return res.status(200).send("No order ID");
    }

    console.log(`[Webhook] Processing fulfillment for order: ${orderId}, payment: ${paymentId}`);

    try {
      const snap = await db.collection("payments").where("razorpayOrderId", "==", orderId).limit(1).get();
      if (snap.empty) {
        console.warn(`[Webhook] No payment record found for order ${orderId}`);
        return res.status(200).send("Payment record not found");
      }

      const paymentDoc = snap.docs[0];
      const pData = paymentDoc.data();

      if (pData.status === "paid") {
        console.log(`[Webhook] Payment ${orderId} already marked as paid`);
        return res.status(200).send("Already paid");
      }

      const result = await fulfillPayment(paymentDoc.id, paymentId || pData.razorpayPaymentId || "webhook_captured", null, null, null);
      console.log(`[Webhook] Successfully fulfilled payment for order ${orderId}:`, result);
      return res.status(200).json({ success: true, result });
    } catch (err) {
      console.error("[Webhook] Error fulfilling payment:", err);
      return res.status(500).send("Internal fulfillment error");
    }
  }

  return res.status(200).send("Event ignored");
});


exports.bookFreeSeva = onCall(async (request) => {
  const data = request.data;
  const auth = request.auth;

  if (!auth || !auth.uid) {
    throw new HttpsError("unauthenticated", "You must be logged in to book.");
  }

  const { serviceId, serviceName, quantity, devotees, donorName, donorPhone, donorEmail, occurrences } = data;

  if (!serviceId || !occurrences || !Array.isArray(occurrences) || occurrences.length === 0) {
    throw new HttpsError("invalid-argument", "Missing required fields or occurrences.");
  }

  if (occurrences.length > 12) {
    throw new HttpsError("invalid-argument", "Maximum recurring duration is 12 months.");
  }
  
  if (quantity < 1) {
    throw new HttpsError("invalid-argument", "Quantity must be at least 1.");
  }

  const isRecurring = occurrences.length > 1;
  const recurringGroupId = isRecurring ? `RG-${Date.now()}` : null;
  const timestamp = Date.now().toString();
  const baseRefStr = `BK-${timestamp.substring(timestamp.length - 6)}`;
  
  return await db.runTransaction(async (transaction) => {
    const slotDocsAndRefs = [];
    
    // 1. Check all slots FIRST before modifying anything
    for (let i = 0; i < occurrences.length; i++) {
      const occ = occurrences[i];
      const start = occ.timeRange.split(" - ")[0];
      const end = occ.timeRange.split(" - ")[1];
      
      if (occ.slotId && occ.slotId !== "custom" && occ.slotId !== "recurring" && !occ.slotId.startsWith("auto_")) {
        let slotDoc = await transaction.get(db.collection("slots").doc(occ.slotId));
        if (slotDoc.exists) {
          const slotData = slotDoc.data();
          const currentBooked = slotData.bookedCount || 0;
          const capacity = slotData.capacity || 0;
          
          if (currentBooked + quantity > capacity) {
            throw new HttpsError("resource-exhausted", `Not enough capacity for ${occ.date} at ${occ.timeRange}. Available: ${capacity - currentBooked}.`);
          }
          
          slotDocsAndRefs.push({
            ref: slotDoc.ref,
            currentBooked: currentBooked,
            isNew: false
          });
          continue; // Skip the else block if found
        }
      }
      
      // If we reach here, it's either no slotId, a custom/recurring/auto_ slotId, or the slotId didn't exist in DB.
      // We dynamically create or find it based on date and time.
      const slotsQuery = db.collection("slots")

          .where("serviceId", "==", serviceId)
          .where("date", "==", occ.date)
          .where("startTime", "==", start)
          .where("endTime", "==", end)
          .where("isActive", "==", true);
          
        const querySnapshot = await transaction.get(slotsQuery);
        
        if (querySnapshot.empty) {
          // If the slot doesn't exist, dynamically create it for recurring bookings
          const newSlotRef = db.collection("slots").doc(`auto_${serviceId}_${occ.date.replace(/-/g, "")}_${start.replace(":", "")}`);
          
          if (quantity > 50) {
            throw new HttpsError("resource-exhausted", `Requested quantity exceeds default auto-slot capacity of 50.`);
          }
          
          slotDocsAndRefs.push({
            ref: newSlotRef,
            currentBooked: 0,
            isNew: true,
            newSlotData: {
              id: newSlotRef.id,
              serviceId: serviceId,
              date: occ.date,
              capacity: 50,
              bookedCount: 0,
              isActive: true,
              startTime: start,
              endTime: end,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            }
          });
        } else {
          const slotDoc = querySnapshot.docs[0];
          const slotData = slotDoc.data();
          const currentBooked = slotData.bookedCount || 0;
          const capacity = slotData.capacity || 0;
          
          if (currentBooked + quantity > capacity) {
            throw new HttpsError("resource-exhausted", `Not enough capacity for ${occ.date} at ${occ.timeRange}. Available: ${capacity - currentBooked}.`);
          }
          
          slotDocsAndRefs.push({
            ref: slotDoc.ref,
            currentBooked: currentBooked,
            isNew: false
          });
        }

    }
    
    // 2. All slots are valid and have capacity! Execute all writes safely.
    const createdBookings = [];
    
    for (let i = 0; i < occurrences.length; i++) {
      const occ = occurrences[i];
      const { ref, currentBooked, isNew, newSlotData } = slotDocsAndRefs[i];
      
      if (isNew) {
        transaction.set(ref, {
          ...newSlotData,
          bookedCount: quantity
        });
      } else {
        // Update slot capacity
        transaction.update(ref, {
          bookedCount: currentBooked + quantity,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
      
      // Assign Devotee IDs
      const bookingRefStr = isRecurring ? `${baseRefStr}-${i + 1}` : baseRefStr;
      const processedDevotees = (devotees || []).map((devotee, index) => ({
        ...devotee,
        devoteeId: `${bookingRefStr}-${index + 1}`
      }));
      
      // Create Booking Document
      const bookingRef = db.collection("bookings").doc();
      const bookingData = {
        userId: auth.uid,
        serviceId,
        serviceName,
        slotId: ref.id,
        bookingRef: bookingRefStr,
        bookingDate: occ.date,
        quantity,
        status: "confirmed",
        paymentStatus: "free",
        totalAmount: 0,
        sourceType: "seva",
        devotees: processedDevotees,
        donorName: donorName || null,
        donorPhone: donorPhone || null,
        donorEmail: donorEmail || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      if (isRecurring) {
        bookingData.recurringGroupId = recurringGroupId;
        bookingData.occurrenceNumber = i + 1;
        bookingData.totalOccurrences = occurrences.length;
      }
      
      transaction.set(bookingRef, bookingData);
      createdBookings.push(bookingRefStr);
    }
    
    return {
      success: true,
      status: "confirmed",
      bookingRefs: createdBookings,
      recurringGroupId: recurringGroupId
    };
  });
});

/**
 * Firestore Trigger: Send FCM push notification to all registered devices
 * when a new notification document is created in the 'notifications' collection.
 */
exports.sendPushOnNotificationCreate = onDocumentCreated(
  {
    document: "notifications/{notificationId}",
    region: "asia-south1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("No data in notification document");
      return;
    }

    const notifData = snap.data();
    const title = notifData.title || "Temple Update";
    const body = notifData.body || "";
    const type = notifData.type || "announcement";
    const imageUrl = notifData.imageUrl || null;
    const actionRoute = notifData.actionRoute || "";

    const targetAudience = notifData.targetAudience || "all";
    const isGlobal = targetAudience === "all" || notifData.isGlobal === true;

    console.log(`[FCM] New notification created: "${title}" (type: ${type}, audience: ${targetAudience})`);

    // Build the FCM message payload
    const notificationId = event.params.notificationId;
    const messagePayload = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        type: type,
        actionRoute: actionRoute,
        notificationId: notificationId,
      },
      android: {
        collapseKey: notificationId,
        priority: "high",
        notification: {
          channelId: "temple_notifications",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
          tag: notificationId,
        },
      },
    };

    // Add image if provided
    if (imageUrl) {
      messagePayload.notification.imageUrl = imageUrl;
    }

    if (isGlobal) {
      // Broadcast via topic 'all_devotees' ONLY.
      // Every device automatically subscribes to 'all_devotees' on app startup.
      // Sending to both topic AND individual tokens causes duplicate push notifications on devices.
      try {
        const response = await getMessaging().send({
          ...messagePayload,
          topic: "all_devotees",
        });
        console.log(`[FCM] Global broadcast push sent successfully to topic 'all_devotees': ${response}`);
      } catch (topicErr) {
        console.error("[FCM] Topic broadcast error, falling back to registered tokens:", topicErr.message);
        // Fallback only if topic broadcast failed
        try {
          const tokensSnap = await db.collectionGroup("tokens").get();
          const seenTokens = new Set();
          const tokenDocs = [];
          tokensSnap.forEach((tDoc) => {
            const t = tDoc.data().token;
            if (t && !seenTokens.has(t)) {
              seenTokens.add(t);
              tokenDocs.push({ token: t, tokenDocRef: tDoc.ref });
            }
          });

          if (tokenDocs.length > 0) {
            await Promise.allSettled(
              tokenDocs.map(async ({ token, tokenDocRef }) => {
                try {
                  await getMessaging().send({
                    ...messagePayload,
                    token: token,
                  });
                } catch (error) {
                  if (
                    error.code === "messaging/invalid-registration-token" ||
                    error.code === "messaging/registration-token-not-registered"
                  ) {
                    await tokenDocRef.delete().catch(() => {});
                  }
                }
              })
            );
          }
        } catch (tokenErr) {
          console.error("[FCM] Error in fallback token broadcast:", tokenErr.message);
        }
      }
    } else {
      // For targeted notifications, collect unique tokens for target users only
      const targetUserId = notifData.userId || notifData.targetUserId;
      const userTokens = new Set();
      const tokenDocs = [];

      if (targetUserId) {
        const tokensSnap = await db.collection("users").doc(targetUserId).collection("tokens").get();
        tokensSnap.forEach(tDoc => {
          const t = tDoc.data().token;
          if (t && !userTokens.has(t)) {
            userTokens.add(t);
            tokenDocs.push({ token: t, tokenDocRef: tDoc.ref });
          }
        });
      }

      if (tokenDocs.length === 0) {
        console.log("[FCM] No device tokens found for targeted push. Skipping.");
        return;
      }

      console.log(`[FCM] Sending targeted push to ${tokenDocs.length} unique device(s)`);

      await Promise.allSettled(
        tokenDocs.map(async ({ token, tokenDocRef }) => {
          try {
            await getMessaging().send({
              ...messagePayload,
              token: token,
            });
          } catch (error) {
            if (
              error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered"
            ) {
              console.log(`[FCM] Removing invalid token: ${token.substring(0, 20)}...`);
              await tokenDocRef.delete().catch(() => {});
            } else {
              console.error(`[FCM] Error sending to token: ${error.message}`);
            }
          }
        })
      );
    }
  }
);

/**
 * Callable Function: Lookup user email by phone number to enable phone + password login
 */
exports.getEmailByPhone = onCall({ invoker: "public" }, async (request) => {
  const phone = request.data?.phone;
  if (!phone || typeof phone !== "string") {
    throw new HttpsError("invalid-argument", "Valid mobile number is required.");
  }

  const clean = phone.replace(/[^\d]/g, "");
  if (clean.length < 10) {
    throw new HttpsError("invalid-argument", "Mobile number must be at least 10 digits.");
  }

  const last10 = clean.slice(-10);
  const candidates = [
    clean,
    last10,
    `+91${last10}`,
    `91${last10}`,
    `0${last10}`,
  ];

  // 1. Query users collection in Firestore
  const usersRef = db.collection("users");
  const querySnap = await usersRef.where("phone", "in", candidates).limit(1).get();

  if (!querySnap.empty) {
    const userData = querySnap.docs[0].data();
    if (userData.email) {
      // Cache in phone_lookup collection for fast direct retrieval
      try {
        await db.collection("phone_lookup").doc(last10).set({
          email: userData.email.toLowerCase().trim(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (_) {}

      return { email: userData.email.trim() };
    }
  }

  // 2. Query Firebase Auth by phone
  try {
    const authUser = await getAuth().getUserByPhoneNumber(`+91${last10}`).catch(() => null);
    if (authUser && authUser.email) {
      return { email: authUser.email.trim() };
    }
  } catch (_) {}

  throw new HttpsError("not-found", "No devotee account found with this mobile number.");
});

