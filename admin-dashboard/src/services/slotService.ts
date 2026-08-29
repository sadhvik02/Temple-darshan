import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Slot } from "../types";

const SLOTS_COLLECTION = collection(db, "slots");

export async function getSlots(): Promise<Slot[]> {
  const q = query(
    SLOTS_COLLECTION, 
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  
  const slots = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Slot[];

  // Sort by startTime in-memory to avoid needing a composite index
  return slots.sort((a, b) => {
    if (a.date === b.date) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });
}

export async function getSlotsByService(serviceId: string): Promise<Slot[]> {
  const q = query(
    SLOTS_COLLECTION, 
    where("serviceId", "==", serviceId)
  );
  const snapshot = await getDocs(q);
  
  const slots = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Slot[];

  // Sort by date and startTime in-memory
  return slots.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.startTime.localeCompare(b.startTime);
  });
}

export async function createSlot(data: Omit<Slot, "id" | "bookedCount" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(SLOTS_COLLECTION, {
    ...data,
    bookedCount: 0, // Always starts at 0
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSlot(id: string, data: Partial<Omit<Slot, "id" | "bookedCount" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "slots", id);
  // bookedCount is intentionally omitted from admin manual updates
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteSlot(id: string): Promise<void> {
  const docRef = doc(db, "slots", id);
  await deleteDoc(docRef);
}
