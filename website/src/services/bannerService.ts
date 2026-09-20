import { collection, getDocs, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Banner } from "../types";

const BANNERS_COLLECTION = collection(db, "banners");

export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const q = query(
      BANNERS_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Banner[];
  } catch (error) {
    console.error("Error fetching active banners:", error);
    return [];
  }
}

/** Real-time subscription to active banners */
export function subscribeToActiveBanners(callback: (items: Banner[]) => void): () => void {
  try {
    const q = query(
      BANNERS_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Banner[]
        );
      },
      (error) => {
        console.error("Error in real-time banners subscription:", error);
      }
    );
  } catch (err) {
    console.error("Error setting up banners listener:", err);
    return () => {};
  }
}
