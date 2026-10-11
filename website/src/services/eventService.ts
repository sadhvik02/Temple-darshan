import { collection, getDocs, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Event } from "../types";

const EVENTS_COLLECTION = collection(db, "events");

function sortEvents(items: Event[]): Event[] {
  return items.sort((a, b) => (a.eventDate || "").localeCompare(b.eventDate || ""));
}

export async function getPublishedEvents(): Promise<Event[]> {
  try {
    const q = query(
      EVENTS_COLLECTION,
      where("isPublished", "==", true)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
    return sortEvents(items);
  } catch (error) {
    console.error("Error fetching published events:", error);
    return [];
  }
}

/** Real-time subscription to published events */
export function subscribeToPublishedEvents(callback: (items: Event[]) => void): () => void {
  try {
    const q = query(
      EVENTS_COLLECTION,
      where("isPublished", "==", true)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];
        callback(sortEvents(items));
      },
      (error) => {
        console.error("Error in events subscription:", error);
      }
    );
  } catch (err) {
    console.error("Error setting up events listener:", err);
    return () => {};
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const docRef = doc(db, "events", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (!data.isPublished) return null;
    return { id: snapshot.id, ...data } as Event;
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    return null;
  }
}
