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
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Event } from "../types";

const EVENTS_COLLECTION = collection(db, "events");

export async function getEvents(): Promise<Event[]> {
  const q = query(
    EVENTS_COLLECTION, 
    orderBy("eventDate", "desc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Event[];
}

export async function createEvent(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(EVENTS_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEvent(id: string, data: Partial<Omit<Event, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "events", id);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteEvent(id: string): Promise<void> {
  const docRef = doc(db, "events", id);
  await deleteDoc(docRef);
}
