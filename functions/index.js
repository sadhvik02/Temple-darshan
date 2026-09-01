const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const Razorpay = require("razorpay");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

// Fetch keys from environment variables (local .env or Firebase functions config)
// In production, these should be handled securely, but for now we read process.env
// The .env file deployed with functions will populate this.
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

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

exports.createPaymentOrder = onCall(async (request) => {
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

  // 2. Atomic Verification & Booking Creation
  return await db.runTransaction(async (transaction) => {
    const paymentRef = db.collection("payments").doc(paymentDocId);
    const paymentDoc = await transaction.get(paymentRef);

    if (!paymentDoc.exists) {
      throw new HttpsError("not-found", "Payment record not found.");
    }

    const pData = paymentDoc.data();
    
    console.log("PAYMENT DOC DATA IN VERIFY:", JSON.stringify(pData));

    // Idempotency check
    if (pData.status === "paid") {
      return { success: true, status: "already_paid", bookingRef: pData.bookingRef };
    }

    // Ensure user owns this payment
    if (pData.userId !== auth.uid) {
      throw new HttpsError("permission-denied", "Payment does not belong to this user.");
    }

    // Ensure order IDs match
    if (pData.razorpayOrderId !== razorpay_order_id) {
      throw new HttpsError("invalid-argument", "Order ID mismatch.");
    }

    let bookingRefStr = null;

    // 3. Handle Seva/Darshan Slot Capacity & Booking
    if (pData.sourceType === "seva" || pData.sourceType === "darshan") {
      let slotData = null;
      
      if (pData.slotId) {
        const slotRef = db.collection("slots").doc(pData.slotId);
        const slotDoc = await transaction.get(slotRef);
        
        if (!slotDoc.exists) {
          if (pData.slotId.startsWith("auto_")) {
            // Auto slot doesn't exist yet, create it dynamically
            const [_, serviceId, dateKey, startEnd] = pData.slotId.split("_");
            // Basic parsing if needed, but we can just use defaults
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
            
            // Check capacity just in case
            if (pData.quantity > 50) {
              transaction.update(paymentRef, { status: "refund_needed", razorpayPaymentId: razorpay_payment_id });
              throw new HttpsError("resource-exhausted", "Capacity exceeded.");
            }
            
            transaction.set(slotRef, slotData);
          } else {
            // Manual slot not found
            transaction.update(paymentRef, { status: "refund_needed", razorpayPaymentId: razorpay_payment_id });
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
              razorpayPaymentId: razorpay_payment_id,
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
        bookingDate: (slotData && slotData.date) ? slotData.date : (pData.bookingDate || "N/A"), // From slot if available, else payload
        quantity: pData.quantity,
        status: "confirmed", // Verified payment means confirmed booking
        paymentStatus: "paid",
        totalAmount: pData.amountInr,
        sourceType: pData.sourceType,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      console.log("BOOKING DATA BEFORE DEVOTEE ASSIGN:", JSON.stringify(bookingData));
      console.log("DEVOTEE DETAILS IN PDATA:", JSON.stringify(pData.devotees));
      
      if (pData.devotees && Array.isArray(pData.devotees) && pData.devotees.length > 0) {
        bookingData.devotees = pData.devotees.map((dev, idx) => ({
          ...dev,
          devoteeId: `${bookingRefStr}-${idx + 1}`
        }));
        console.log("Assigned pData.devotees to bookingData");
      } else if (devoteeDetails) {
        bookingData.devotees = [{
          ...devoteeDetails,
          devoteeId: `${bookingRefStr}-1`
        }];
        console.log("Assigned single devoteeDetails to bookingData");
      } else if (pData.devoteeName) {
        bookingData.devotees = [{
          name: pData.devoteeName,
          phone: pData.devoteePhone || "",
          email: pData.devoteeEmail || "",
          devoteeId: `${bookingRefStr}-1`
        }];
        console.log("Assigned single pData.devoteeName to bookingData");
      }
      
      console.log("FINAL BOOKING DATA:", JSON.stringify(bookingData));

      transaction.set(bookingRef, bookingData);

      // Update Payment Record
      transaction.update(paymentRef, {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        bookingId: bookingRef.id,
        bookingRef: bookingRefStr,
        updatedAt: FieldValue.serverTimestamp()
      });

    } 
    // 4. Handle Donation Transaction
    else if (pData.sourceType === "donation") {
      const donationRef = db.collection("donations").doc();
      const userDoc = await transaction.get(db.collection("users").doc(auth.uid));
      const userName = userDoc.exists ? userDoc.data().name : "Devotee";
      const userPhone = userDoc.exists ? userDoc.data().phone : "";

      const donationData = {
        userId: auth.uid,
        donationTypeId: pData.offeringId,
        donationTypeName: pData.offeringName,
        amount: pData.amountInr,
        paymentId: paymentRef.id,
        razorpayPaymentId: razorpay_payment_id,
        status: "completed",
        donorName: pData.donorName || userName,
        donorPhone: pData.donorPhone || userPhone,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(donationRef, donationData);

      // Update Payment Record
      transaction.update(paymentRef, {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        donationId: donationRef.id,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    return { 
      success: true, 
      status: "paid", 
      bookingRef: bookingRefStr 
    };
  });
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
      
      if (occ.slotId) {
        let slotDoc = await transaction.get(db.collection("slots").doc(occ.slotId));
        if (!slotDoc.exists) {
          throw new HttpsError("failed-precondition", `Slot unavailable for ${occ.date} at ${occ.timeRange}. Please ensure slots are available for all dates.`);
        }
        
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
      } else {
        // Query the slots collection to find the exact admin-created slot
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
