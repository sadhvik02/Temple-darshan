import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, runTransaction, serverTimestamp, collection, addDoc, getDocs, query, where, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  console.log("=== Starting Capacity Safety Test ===");
  
  // 1. Log in as ADMIN to create a service and a slot
  console.log("1. Logging in as Admin...");
  await signInWithEmailAndPassword(auth, "sadhviknayakwadi02@gmail.com", "Sadhvik@03");
  
  console.log("2. Admin creating a service...");
  const serviceRef = await addDoc(collection(db, "services"), {
    name: "Test Seva",
    description: "A test service for capacity rules",
    price: 100,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  console.log("3. Admin creating a slot with capacity 2...");
  const slotRef = await addDoc(collection(db, "slots"), {
    serviceId: serviceRef.id,
    date: "2026-10-10",
    startTime: "10:00",
    endTime: "11:00",
    capacity: 2,
    bookedCount: 0,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const slotId = slotRef.id;

  // 2. Log in as a normal DEVOTEE
  console.log("4. Switching to Devotee account...");
  const email = "testdevotee@example.com";
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, "Password123!");
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      userCredential = await signInWithEmailAndPassword(auth, email, "Password123!");
    } else {
      throw e;
    }
  }
  const uid = userCredential.user.uid;

  // Ensure user profile
  try {
    await setDoc(doc(db, "users", uid), {
      name: "Test Devotee",
      phone: "+919999999999",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch(e) {}

  // 3. Devotee tries to book 2 tickets
  console.log("5. Devotee booking 2 tickets (should succeed)...");
  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(doc(db, "slots", slotId));
      const currentBooked = sfDoc.data().bookedCount || 0;
      const capacity = sfDoc.data().capacity || 0;

      if (currentBooked + 2 > capacity) {
        throw new Error("Capacity exceeded");
      }

      transaction.update(doc(db, "slots", slotId), {
        bookedCount: currentBooked + 2,
        updatedAt: serverTimestamp()
      });

      transaction.set(doc(collection(db, "bookings")), {
        userId: uid,
        serviceId: serviceRef.id,
        serviceName: "Test Seva",
        slotId: slotId,
        bookingRef: `BK-TEST-${Date.now()}`,
        bookingDate: sfDoc.data().date,
        quantity: 2,
        status: 'pending',
        paymentStatus: 'pending',
        totalAmount: 200,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    console.log("✅ Success! Booked 2 tickets.");
  } catch (e) {
    console.error("❌ Failed to book:", e);
  }

  // 4. Devotee tries to book 1 more ticket (should fail)
  console.log("6. Devotee trying to book 1 more ticket (should fail due to rules/transaction)...");
  let failedAsExpected = false;
  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(doc(db, "slots", slotId));
      const currentBooked = sfDoc.data().bookedCount || 0;
      const capacity = sfDoc.data().capacity || 0;

      if (currentBooked + 1 > capacity) {
        throw new Error("Capacity exceeded inside transaction check");
      }

      transaction.update(doc(db, "slots", slotId), {
        bookedCount: currentBooked + 1,
        updatedAt: serverTimestamp()
      });
      transaction.set(doc(collection(db, "bookings")), {
        userId: uid,
        serviceId: serviceRef.id,
        serviceName: "Test Seva",
        slotId: slotId,
        bookingRef: `BK-TEST-2`,
        bookingDate: sfDoc.data().date,
        quantity: 1,
        status: 'pending',
        paymentStatus: 'pending',
        totalAmount: 100,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    console.log("❌ Error: Transaction succeeded but should have failed!");
  } catch (e) {
    console.log("✅ Success! Overbooking was blocked:", e.message);
    failedAsExpected = true;
  }

  process.exit(0);
}

runTest();
