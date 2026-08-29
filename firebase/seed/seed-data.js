/**
 * Temple Digital Platform — Development Seed Data
 *
 * ⚠ DEVELOPMENT USE ONLY — Do not run against production.
 *
 * This script creates sample documents in Firestore for local
 * development and testing. It uses the Firebase Admin SDK which
 * bypasses security rules (server-side access).
 *
 * Prerequisites:
 *   1. Node.js installed
 *   2. npm install firebase-admin
 *   3. A Firebase service account key (download from Firebase Console
 *      > Project Settings > Service Accounts > Generate new private key)
 *   4. Set the path to your key file below or via environment variable
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./path-to-key.json node seed-data.js
 *
 * ⚠ NEVER commit the service account key file to version control.
 */

const admin = require("firebase-admin");

// Initialize with Application Default Credentials
// The GOOGLE_APPLICATION_CREDENTIALS env var must point to a service account key
admin.initializeApp();

const db = admin.firestore();
const { FieldValue } = admin.firestore;

async function seedData() {
  console.log("🌱 Starting seed data creation...\n");

  // ----- Temple Info -----
  console.log("📍 Creating temple info...");
  await db.doc("templeInfo/main").set({
    name: "[DEV] Sample Temple",
    description:
      "[DEV DATA] This is sample temple information for development purposes only.",
    address: "123 Temple Road",
    city: "Sample City",
    state: "Sample State",
    pincode: "500001",
    phone: "+91-9999999999",
    email: "dev@example.com",
    website: "",
    timings: {
      morning: "6:00 AM - 12:00 PM",
      evening: "4:00 PM - 9:00 PM",
    },
    imageUrl: "",
    updatedAt: FieldValue.serverTimestamp(),
  });

  // ----- Banners -----
  console.log("🖼  Creating sample banners...");
  const banners = [
    {
      title: "[DEV] Welcome Banner",
      imageUrl: "",
      isActive: true,
      displayOrder: 1,
      actionUrl: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      title: "[DEV] Festival Banner",
      imageUrl: "",
      isActive: true,
      displayOrder: 2,
      actionUrl: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];
  for (const banner of banners) {
    await db.collection("banners").add(banner);
  }

  // ----- Services -----
  console.log("🪔  Creating sample services...");
  const services = [
    {
      name: "[DEV] Special Darshan",
      description: "[DEV DATA] Special darshan service for development testing.",
      imageUrl: "",
      price: 200,
      bookingEnabled: true,
      isActive: true,
      displayOrder: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      name: "[DEV] Archana",
      description: "[DEV DATA] Archana seva for development testing.",
      imageUrl: "",
      price: 100,
      bookingEnabled: true,
      isActive: true,
      displayOrder: 2,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      name: "[DEV] Abhishekam",
      description: "[DEV DATA] Abhishekam seva for development testing.",
      imageUrl: "",
      price: 500,
      bookingEnabled: false,
      isActive: true,
      displayOrder: 3,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  const serviceRefs = [];
  for (const service of services) {
    const ref = await db.collection("services").add(service);
    serviceRefs.push(ref.id);
  }

  // ----- Slots (for the first bookable service) -----
  console.log("📅 Creating sample slots...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const slots = [
    {
      serviceId: serviceRefs[0],
      date: dateStr,
      startTime: "06:00",
      endTime: "07:00",
      capacity: 50,
      bookedCount: 0,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      serviceId: serviceRefs[0],
      date: dateStr,
      startTime: "07:00",
      endTime: "08:00",
      capacity: 50,
      bookedCount: 0,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];
  for (const slot of slots) {
    await db.collection("slots").add(slot);
  }

  // ----- News -----
  console.log("📰 Creating sample news...");
  await db.collection("news").add({
    title: "[DEV] Temple Renovation Complete",
    content:
      "[DEV DATA] Sample news article for development testing. Not real content.",
    imageUrl: "",
    isPublished: true,
    publishedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // ----- Events -----
  console.log("🎉 Creating sample events...");
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const eventDateStr = nextWeek.toISOString().split("T")[0];

  await db.collection("events").add({
    title: "[DEV] Annual Festival",
    description:
      "[DEV DATA] Sample event for development testing. Not a real event.",
    imageUrl: "",
    eventDate: eventDateStr,
    startTime: "06:00",
    endTime: "21:00",
    isPublished: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("\n✅ Seed data created successfully!");
  console.log("⚠  Remember: All data is prefixed with [DEV] — not real content.");
  console.log(
    "⚠  To create an admin user, first create a Firebase Auth account,"
  );
  console.log(
    "   then manually add a document to the admins collection with"
  );
  console.log("   the Auth UID as the document ID.\n");

  process.exit(0);
}

seedData().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
