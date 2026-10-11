import { collection, getDocs, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { News } from "../types";

const NEWS_COLLECTION = collection(db, "news");

function sortNews(items: News[]): News[] {
  return items.sort((a, b) => {
    const timeA = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
    const timeB = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getPublishedNews(): Promise<News[]> {
  try {
    const q = query(
      NEWS_COLLECTION,
      where("isPublished", "==", true)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as News[];
    return sortNews(items);
  } catch (error) {
    console.error("Error fetching published news:", error);
    return [];
  }
}

/** Real-time subscription to published news from Admin Dashboard */
export function subscribeToPublishedNews(callback: (items: News[]) => void): () => void {
  try {
    const q = query(
      NEWS_COLLECTION,
      where("isPublished", "==", true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as News[];
        callback(sortNews(items));
      },
      (error) => {
        console.error("Error in news subscription:", error);
      }
    );
  } catch (err) {
    console.error("Error setting up news listener:", err);
    return () => {};
  }
}

export async function getNewsById(id: string): Promise<News | null> {
  try {
    const docRef = doc(db, "news", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (!data.isPublished) return null;
    return { id: snapshot.id, ...data } as News;
  } catch (error) {
    console.error("Error fetching news by ID:", error);
    return null;
  }
}
