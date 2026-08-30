import { db } from "../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import type { Donation } from "../types";

export class DonationService {
  /**
   * Get all donations (Admin only)
   */
  static async getAllDonations(): Promise<Donation[]> {
    try {
      const q = query(
        collection(db, "donations"),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Donation;
      });
    } catch (error) {
      console.error("Error fetching donations:", error);
      throw error;
    }
  }
}
