import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Service } from "../types";

const SERVICES_COLLECTION = collection(db, "services");

export async function getActiveServices(): Promise<Service[]> {
  try {
    const q = query(
      SERVICES_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
  } catch (error) {
    console.error("Error fetching active services:", error);
    return [];
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const docRef = doc(db, "services", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (!data.isActive) return null;
    return { id: snapshot.id, ...data } as Service;
  } catch (error) {
    console.error("Error fetching service by ID:", error);
    return null;
  }
}
