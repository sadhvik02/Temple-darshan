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
import type { Service } from "../types";

const SERVICES_COLLECTION = collection(db, "services");

export async function getServices(): Promise<Service[]> {
  const q = query(SERVICES_COLLECTION, orderBy("displayOrder", "asc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Service[];
}

export async function createService(data: Omit<Service, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(SERVICES_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateService(id: string, data: Partial<Omit<Service, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "services", id);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteService(id: string): Promise<void> {
  const docRef = doc(db, "services", id);
  await deleteDoc(docRef);
}
