const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
admin.initializeApp();
const db = getFirestore();

async function fix() {
  await db.collection('users').doc('wwV0nAaz9BTllR1bRbxYKJwT5Cb2').set({
    name: 'Devotee',
    email: 'sadhviknayakwadi02@gmail.com',
    phone: '',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('User doc created!');
}
fix().catch(console.error);
