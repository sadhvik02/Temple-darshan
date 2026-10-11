import { collection, getDocs, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Service } from "../types";

const SERVICES_COLLECTION = collection(db, "services");

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "shiva-seva",
    name: "Shiva Seva",
    description:
      "Devotional seva dedicated to Lord Shiva with holy bilva patra offerings, deepa aradhana, and sacred Rudra chanting for peace and wellbeing.",
    category: "ashrama_seva",
    price: 0,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 1,
    imageUrl: "/shiva_seva.jpg",
  },
  {
    id: "ganesh-puja",
    name: "Sri Ganesha Puja & Archana",
    description:
      "Auspicious Lord Ganesha Puja performed with sacred modak offerings, durva grass, and Vedic chants to remove obstacles and invite prosperity.",
    category: "ashrama_seva",
    price: 0,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 2,
    imageUrl: "/ganesh_seva.jpg",
  },
  {
    id: "maha-rudra-abhishekam",
    name: "Maha Rudra Abhishekam",
    description:
      "Sacred morning bath ritual consecrated with holy panchamritam, fresh fragrant flowers, bilva patra, and Vedic hymns for spiritual upliftment.",
    category: "arjita_seva",
    price: 1116,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 3,
    imageUrl: "/shiva_seva.jpg",
  },
  {
    id: "nitya-annadanam",
    name: "Nitya Annadanam Seva",
    description:
      "Sacred offering of consecrated satvik bhojanam to visiting sadhus, pilgrims, and devotees ascending Navasiddula Gutta.",
    category: "ashrama_seva",
    price: 0,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 4,
    imageUrl: "/annadanam_seva.jpg",
  },
  {
    id: "goshala-seva",
    name: "Kamadhenu Go-Puja & Seva",
    description:
      "Venerate and feed the sacred cows of the Ashram Goshala with fresh green fodder, jaggery, and loving care.",
    category: "arjita_seva",
    price: 501,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 5,
    imageUrl: "/goshala_seva.jpg",
  },
];

function formatServiceDoc(docSnap: any): Service {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    name: data.name || "Sacred Seva",
    description: data.description || "",
    category: data.category || (data.price === 0 ? "ashrama_seva" : "arjita_seva"),
    imageUrl: data.imageUrl || "",
    price: typeof data.price === "number" ? data.price : 0,
    bookingEnabled: data.bookingEnabled ?? true,
    isActive: data.isActive ?? true,
    displayOrder: typeof data.displayOrder === "number" ? data.displayOrder : 99,
  };
}

export async function getActiveServices(): Promise<Service[]> {
  try {
    // 1. Single-field query to avoid requiring composite indexes on isActive + displayOrder
    const q = query(SERVICES_COLLECTION, where("isActive", "==", true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const items = snapshot.docs.map(formatServiceDoc);
      return items.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    // 2. Fallback: query without where in case isActive is omitted on legacy records
    const allSnap = await getDocs(SERVICES_COLLECTION);
    if (!allSnap.empty) {
      const allItems = allSnap.docs.map(formatServiceDoc).filter((s) => s.isActive !== false);
      if (allItems.length > 0) {
        return allItems.sort((a, b) => a.displayOrder - b.displayOrder);
      }
    }

    return DEFAULT_SERVICES;
  } catch (error) {
    console.warn("Firestore services fetch error, using default services:", error);
    return DEFAULT_SERVICES;
  }
}

/** Real-time subscription to active services with seamless fallback */
export function subscribeToActiveServices(callback: (items: Service[]) => void): () => void {
  try {
    // Single-field query (no composite index needed)
    const q = query(SERVICES_COLLECTION, where("isActive", "==", true));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(formatServiceDoc);
          callback(items.sort((a, b) => a.displayOrder - b.displayOrder));
        } else {
          callback(DEFAULT_SERVICES);
        }
      },
      (error) => {
        console.warn("Real-time services subscription warning, using default services:", error);
        callback(DEFAULT_SERVICES);
      }
    );
  } catch (err) {
    console.warn("Services listener setup warning, using default services:", err);
    callback(DEFAULT_SERVICES);
    return () => {};
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const docRef = doc(db, "services", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const s = formatServiceDoc(snapshot);
      if (s.isActive) return s;
    }
  } catch (error) {
    console.warn("Error fetching service by ID:", error);
  }

  // Fallback to default list if not in Firestore
  const fallback = DEFAULT_SERVICES.find((s) => s.id === id);
  return fallback || null;
}
