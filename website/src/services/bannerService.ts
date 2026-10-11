import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Banner } from "../types";

const BANNERS_COLLECTION = collection(db, "banners");

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: "welcome-banner",
    title: "Sri Kedareshwara Ashramam atop Navasiddula Gutta",
    imageUrl: "/darshan_general.jpg",
    actionUrl: "/about",
    isActive: true,
    displayOrder: 1,
  },
  {
    id: "darshan-banner",
    title: "Sacred Daily Darshan & Divine Blessings",
    imageUrl: "/darshan_special.jpg",
    actionUrl: "/darshan",
    isActive: true,
    displayOrder: 2,
  },
];

function formatBannerDoc(docSnap: any): Banner {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    title: data.title || "Sri Kedareshwara Ashramam",
    actionUrl: data.actionUrl || "",
    imageUrl: data.imageUrl || "/darshan_general.jpg",
    isActive: data.isActive ?? true,
    displayOrder: typeof data.displayOrder === "number" ? data.displayOrder : 99,
  };
}

export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const q = query(BANNERS_COLLECTION, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const items = snapshot.docs.map(formatBannerDoc);
      return items.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return DEFAULT_BANNERS;
  } catch (error) {
    console.warn("Error fetching active banners, using defaults:", error);
    return DEFAULT_BANNERS;
  }
}

/** Real-time subscription to active banners with fallback */
export function subscribeToActiveBanners(callback: (items: Banner[]) => void): () => void {
  try {
    const q = query(BANNERS_COLLECTION, where("isActive", "==", true));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(formatBannerDoc);
          callback(items.sort((a, b) => a.displayOrder - b.displayOrder));
        } else {
          callback(DEFAULT_BANNERS);
        }
      },
      (error) => {
        console.warn("Real-time banners error, using defaults:", error);
        callback(DEFAULT_BANNERS);
      }
    );
  } catch (err) {
    console.warn("Error setting up banners listener, using defaults:", err);
    callback(DEFAULT_BANNERS);
    return () => {};
  }
}
