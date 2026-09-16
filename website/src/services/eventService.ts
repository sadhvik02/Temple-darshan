import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Event } from "../types";

const EVENTS_COLLECTION = collection(db, "events");

export async function getPublishedEvents(): Promise<Event[]> {
  try {
    const q = query(
      EVENTS_COLLECTION,
      where("isPublished", "==", true),
      orderBy("eventDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  } catch (error) {
    console.error("Error fetching published events:", error);
    try {
      const fallbackQuery = query(
        EVENTS_COLLECTION,
        where("isPublished", "==", true)
      );
      const snapshot = await getDocs(fallbackQuery);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      return items.sort((a, b) => (a.eventDate || "").localeCompare(b.eventDate || ""));
    } catch (fallbackErr) {
      console.error("Fallback event fetch failed:", fallbackErr);
      return [];
    }
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
