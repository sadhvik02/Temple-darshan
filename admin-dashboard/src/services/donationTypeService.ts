import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { DonationType } from "../types";

const DONATION_TYPES_COLLECTION = collection(db, "donationTypes");

export async function getDonationTypes(): Promise<DonationType[]> {
  const q = query(DONATION_TYPES_COLLECTION, orderBy("displayOrder", "asc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as DonationType[];
}

export async function createDonationType(data: Omit<DonationType, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(DONATION_TYPES_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDonationType(id: string, data: Partial<Omit<DonationType, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "donationTypes", id);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteDonationType(id: string): Promise<void> {
  const docRef = doc(db, "donationTypes", id);
  await deleteDoc(docRef);
}
