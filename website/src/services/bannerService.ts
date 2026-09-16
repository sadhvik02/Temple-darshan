import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
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
