import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { News } from "../types";

const NEWS_COLLECTION = collection(db, "news");

export async function getNews(): Promise<News[]> {
  const q = query(
    NEWS_COLLECTION, 
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as News[];
}

export async function createNews(data: Omit<News, "id" | "publishedAt" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(NEWS_COLLECTION, {
    ...data,
    publishedAt: data.isPublished ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateNews(id: string, data: Partial<Omit<News, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "news", id);
  
  const updateData: any = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // If isPublished is explicitly provided in the update payload,
  // handle the publishedAt timestamp dynamically.
  if (data.isPublished !== undefined) {
    if (data.isPublished) {
      updateData.publishedAt = serverTimestamp();
    } else {
      updateData.publishedAt = null;
    }
  }

  await setDoc(docRef, updateData, { merge: true });
}

export async function deleteNews(id: string): Promise<void> {
  const docRef = doc(db, "news", id);
  await deleteDoc(docRef);
}
