const apiKey = "AIzaSyBBKnCXhO27GvKFl64s_O_YRb2QU00XVQw";
const projectId = "temple-darshan-app-d1719";

async function run() {
  const { initializeApp } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  const { getAuth } = require("firebase-admin/auth");
  initializeApp();
  const db = getFirestore();
  const adminAuth = getAuth();

  const customToken = await adminAuth.createCustomToken("test_uid_123");

  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  
  if (!authRes.ok) {
    console.error("Auth failed:", await authRes.text());
    return;
  }
  const authData = await authRes.json();
  const idToken = authData.idToken;
  console.log("-> Authenticated as UID:", authData.localId);

  console.log("\n2. Calling createPaymentOrder (Donation)...");
  
  const mockDonationId = "test_donation_123";
  await db.collection("donationTypes").doc(mockDonationId).set({
    title: "Test Donation",
    description: "Testing backend",
    isActive: true,
    suggestedAmounts: [500]
  });
  console.log("-> Mock donation type created.");
  
  const callRes = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/createPaymentOrder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      data: {
        sourceType: "donation",
        offeringId: mockDonationId,
        donationAmount: 500
      }
    })
  });
  
  const callData = await callRes.json();
  if (callData.error) {
    console.error("-> Function returned error:", callData.error);
    return;
  }
  
  console.log("-> Success! Order created:", callData.result);
  
  console.log("\n3. Testing verifyPayment with invalid signature...");
  const verifyRes = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/verifyPayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      data: {
        razorpay_order_id: callData.result.orderId,
        razorpay_payment_id: "pay_test123",
        razorpay_signature: "invalid_signature",
        paymentDocId: callData.result.paymentDocId
      }
    })
  });
  
  const verifyData = await verifyRes.json();
  if (verifyData.error && verifyData.error.status === "PERMISSION_DENIED") {
    console.log("-> Success! Verification correctly rejected invalid signature:", verifyData.error.message);
  } else {
    console.error("-> Failed! Expected permission denied but got:", verifyData);
  }
  
  console.log("\nBackend tests passed successfully.");
  process.exit(0);
}

run().catch(console.error);
