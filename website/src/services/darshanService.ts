import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
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

export async function getActiveDarshans(): Promise<Darshan[]> {
  try {
    const q = query(
      DARSHANS_COLLECTION,
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snapshot = await getDocs(q);
    const fetched = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Darshan[];

    if (!fetched || fetched.length === 0) {
      return DEFAULT_DARSHANS;
    }

    // Enhance fetched darshans with consecrated imagery and ensure 3 complete cards
    const enhanced = fetched.map((item) => {
      const upper = (item.name || "").toUpperCase();
      let imageUrl = item.imageUrl;
      let name = item.name;
      let description = item.description;

      if (upper.includes("VIP")) {
        name = "VIP Divya Darshan";
        imageUrl = imageUrl || "/darshan_vip.jpg";
        if (!description || description.toLowerCase().includes("dhrashan") || description.length < 20) {
          description = "Priority direct sanctum entrance with personalized ashram guidance, special aarati deepam blessings, and consecrated sacred laddu prasadam.";
        }
      } else if (upper.includes("SPECIAL")) {
        name = "Special Entry Darshan";
        imageUrl = imageUrl || "/darshan_special.jpg";
        if (!description || description.length < 25) {
          description = "Expedited queue entry with quick sanctum access, close deity darshan, and holy prasadam blessing for devotees and families.";
        }
      } else {
        imageUrl = imageUrl || "/darshan_general.jpg";
      }

      return {
        ...item,
        name,
        description,
        imageUrl,
      };
    });

    // If General Public Darshan is missing, prepend it to form the complete sacred triad
    const hasGeneral = enhanced.some((d) => d.price === 0 || d.name.toUpperCase().includes("GENERAL"));
    if (!hasGeneral) {
      return [DEFAULT_DARSHANS[0], ...enhanced];
    }

    return enhanced;
  } catch (error) {
    console.error("Error fetching active darshans:", error);
    return DEFAULT_DARSHANS;
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
    // Fallback to default by id
    const found = DEFAULT_DARSHANS.find((d) => d.id === id);
    return found || null;
  } catch (error) {
    console.error("Error fetching darshan by ID:", error);
    const found = DEFAULT_DARSHANS.find((d) => d.id === id);
    return found || null;
  }
}
