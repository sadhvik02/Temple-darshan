import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { News } from "../types";

const NEWS_COLLECTION = collection(db, "news");

export async function getPublishedNews(): Promise<News[]> {
  try {
    const q = query(
      NEWS_COLLECTION,
      where("isPublished", "==", true),
      orderBy("publishedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as News[];
  } catch (error) {
    console.error("Error fetching published news:", error);
    // Fallback in case some published items don't have publishedAt populated
    try {
      const fallbackQuery = query(
        NEWS_COLLECTION,
        where("isPublished", "==", true)
      );
      const snapshot = await getDocs(fallbackQuery);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as News[];
      return items.sort((a, b) => {
        const timeA = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    } catch (fallbackErr) {
      console.error("Fallback news fetch failed:", fallbackErr);
      return [];
    }
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
