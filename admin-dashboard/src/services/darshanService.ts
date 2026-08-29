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
import type { Darshan } from "../types";

const DARSHANS_COLLECTION = collection(db, "darshans");

export async function getDarshans(): Promise<Darshan[]> {
  const q = query(DARSHANS_COLLECTION, orderBy("displayOrder", "asc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Darshan[];
}

export async function createDarshan(data: Omit<Darshan, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(DARSHANS_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDarshan(id: string, data: Partial<Omit<Darshan, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "darshans", id);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteDarshan(id: string): Promise<void> {
  const docRef = doc(db, "darshans", id);
  await deleteDoc(docRef);
}
