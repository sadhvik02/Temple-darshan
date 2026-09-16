import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { DonationType } from "../types";

const DONATION_TYPES_COLLECTION = collection(db, "donationTypes");

export async function getActiveDonationTypes(): Promise<DonationType[]> {
  try {
    const q = query(
      DONATION_TYPES_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DonationType[];
  } catch (error) {
    console.error("Error fetching active donation types:", error);
    return [];
  }
}
