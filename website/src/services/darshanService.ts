import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Darshan } from "../types";

const DARSHANS_COLLECTION = collection(db, "darshans");

export async function getActiveDarshans(): Promise<Darshan[]> {
  try {
    const q = query(
      DARSHANS_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Darshan[];
  } catch (error) {
    console.error("Error fetching active darshans:", error);
    return [];
  }
}

export async function getDarshanById(id: string): Promise<Darshan | null> {
  try {
    const docRef = doc(db, "darshans", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (!data.isActive) return null;
    return { id: snapshot.id, ...data } as Darshan;
  } catch (error) {
    console.error("Error fetching darshan by ID:", error);
    return null;
  }
}
