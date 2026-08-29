const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

async function createFirstAdmin() {
  initializeApp({
    credential: applicationDefault(),
    projectId: "temple-darshan-app-d1719"
  });

  const email = "sadhviknayakwadi02@gmail.com";
  const password = "Sadhvik@03";
  const name = "Sadhvik Nayakwadi";

  try {
    let userRecord;
    try {
      userRecord = await getAuth().getUserByEmail(email);
      console.log(`User already exists with UID: ${userRecord.uid}`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await getAuth().createUser({
          email: email,
          password: password,
          displayName: name,
        });
        console.log(`Successfully created new user: ${userRecord.uid}`);
      } else {
        throw e;
      }
    }

    const db = getFirestore();
    const adminRef = db.collection('admins').doc(userRecord.uid);
    
    await adminRef.set({
      name: name,
      email: email,
      role: 'admin',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    console.log(`Successfully added admin document for ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating first admin:", error);
    process.exit(1);
  }
}

createFirstAdmin();
