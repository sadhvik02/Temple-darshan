import { collection, getDocs, doc, getDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Darshan } from "../types";

const DARSHANS_COLLECTION = collection(db, "darshans");

export const DEFAULT_DARSHANS: Darshan[] = [
  {
    id: "general-darshan",
    name: "General Public Darshan",
    description:
      "Sacred walk-in darshan open daily for all visiting pilgrims with no prior ticket or registration required. Receive divine blessings in tranquility.",
    price: 0,
    bookingEnabled: false,
    isActive: true,
    displayOrder: 1,
    imageUrl: "/darshan_general.jpg",
  },
  {
    id: "special-entry-darshan",
    name: "Special Entry Darshan",
    description:
      "Expedited queue entry with quick sanctum access, close deity darshan, and holy prasadam blessing for devotees and families.",
    price: 500,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 2,
    imageUrl: "/darshan_special.jpg",
  },
  {
    id: "vip-divya-darshan",
    name: "VIP Divya Darshan",
    description:
      "Priority direct sanctum entrance with personalized ashram guidance, special aarati deepam blessings, and consecrated sacred laddu prasadam.",
    price: 1000,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 3,
    imageUrl: "/darshan_vip.jpg",
  },
];

function formatDarshanDoc(doc: any): Darshan {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    name: data.name || "Sacred Darshan",
    description: data.description || "Receive divine blessings at Sri Kedareshwara Ashramam.",
    imageUrl: data.imageUrl || "/darshan_general.jpg",
    price: typeof data.price === "number" ? data.price : 0,
    bookingEnabled: data.bookingEnabled ?? false,
    isActive: data.isActive ?? true,
    displayOrder: data.displayOrder ?? 1,
  };
}

export async function getActiveDarshans(): Promise<Darshan[]> {
  try {
    const q = query(
      DARSHANS_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return DEFAULT_DARSHANS;
    }
    return snapshot.docs.map(formatDarshanDoc);
  } catch (error) {
    console.error("Error fetching active darshans:", error);
    return DEFAULT_DARSHANS;
  }
}

/** Subscribe in real-time to darshan offerings managed in Admin Dashboard */
export function subscribeToActiveDarshans(
  callback: (items: Darshan[]) => void
): () => void {
  try {
    const q = query(
      DARSHANS_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(DEFAULT_DARSHANS);
        } else {
          callback(snapshot.docs.map(formatDarshanDoc));
        }
      },
      (error) => {
        console.error("Error in real-time darshans subscription:", error);
      }
    );
  } catch (err) {
    console.error("Error setting up darshans listener:", err);
    return () => {};
  }
}

export async function getDarshanById(id: string): Promise<Darshan | null> {
  try {
    const docRef = doc(db, "darshans", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.isActive) return { id: snapshot.id, ...data } as Darshan;
    }
    const found = DEFAULT_DARSHANS.find((d) => d.id === id);
    return found || null;
  } catch (error) {
    console.error("Error fetching darshan by ID:", error);
    const found = DEFAULT_DARSHANS.find((d) => d.id === id);
    return found || null;
  }
}
