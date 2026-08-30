import { db } from "../lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import type { Payment } from "../types";

export class PaymentService {
  /**
   * Get all payments (Admin only)
   */
  static async getAllPayments(): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, "payments"),
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
        } as Payment;
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
  }
}
