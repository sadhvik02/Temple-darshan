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
import type { Banner } from "../types";

const BANNERS_COLLECTION = collection(db, "banners");

export async function getBanners(): Promise<Banner[]> {
  const q = query(BANNERS_COLLECTION, orderBy("displayOrder", "asc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Banner[];
}

export async function createBanner(data: Omit<Banner, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(BANNERS_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBanner(id: string, data: Partial<Omit<Banner, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "banners", id);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteBanner(id: string): Promise<void> {
  const docRef = doc(db, "banners", id);
  await deleteDoc(docRef);
}
