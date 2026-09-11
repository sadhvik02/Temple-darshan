import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { NotificationItem } from "../types";

const NOTIFICATIONS_COLLECTION = collection(db, "notifications");

export async function getNotifications(): Promise<NotificationItem[]> {
  const q = query(
    NOTIFICATIONS_COLLECTION, 
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as NotificationItem[];
}

function cleanPayload<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as Partial<T>;
}

export async function createNotification(data: Omit<NotificationItem, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const payload = cleanPayload({
    ...data,
    isGlobal: data.targetAudience === 'all',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const docRef = await addDoc(NOTIFICATIONS_COLLECTION, payload);
  return docRef.id;
}

export async function updateNotification(id: string, data: Partial<Omit<NotificationItem, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const docRef = doc(db, "notifications", id);
  const payload = cleanPayload({
    ...data,
    ...(data.targetAudience !== undefined ? { isGlobal: data.targetAudience === 'all' } : {}),
    updatedAt: serverTimestamp(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteNotification(id: string): Promise<void> {
  const docRef = doc(db, "notifications", id);
  await deleteDoc(docRef);
}

