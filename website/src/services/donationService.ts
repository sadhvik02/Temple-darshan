import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { DonationType } from "../types";

const DONATION_TYPES_COLLECTION = collection(db, "donationTypes");

export const DEFAULT_DONATION_TYPES: DonationType[] = [
  {
    id: "nitya-annadanam",
    title: "Nitya Annadanam Seva",
    category: "annadanam",
    description:
      "Offer consecrated satvik prasadam daily to visiting pilgrims, sadhus, and devotees ascending Navasiddula Gutta. Annadanam is hailed as Maha Daana.",
    imageUrl: "/annadanam_seva.jpg",
    suggestedAmounts: [501, 1116, 2500, 5000],
    isActive: true,
    displayOrder: 1,
  },
  {
    id: "goshala-seva",
    title: "Goshala & Go-Samrakshana",
    category: "other",
    description:
      "Nurture and protect sacred cows with nutritious green fodder, pure shelter, and healthcare in the Ashram Goshala in honor of mother Kamadhenu.",
    imageUrl: "/goshala_seva.jpg",
    suggestedAmounts: [251, 501, 1001, 2500],
    isActive: true,
    displayOrder: 2,
  },
  {
    id: "mandir-nirman",
    title: "Mandir Nirman & Renovation",
    category: "renovation",
    description:
      "Support continuous temple stone sculpting, sanctum sanctorum expansion, ashram electrification, and sacred heritage preservation on Navasiddula Gutta.",
    imageUrl: "/mandir_nirman.jpg",
    suggestedAmounts: [1001, 2501, 5001, 11000],
    isActive: true,
    displayOrder: 3,
  },
];

function formatDonationDoc(doc: any): DonationType {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    title: data.title || "Sacred Seva Fund",
    description:
      data.description ||
      "Support the spiritual activities and temple maintenance of Sri Kedareshwara Ashramam.",
    imageUrl: data.imageUrl || "/annadanam_seva.jpg",
    suggestedAmounts:
      data.suggestedAmounts && Array.isArray(data.suggestedAmounts) && data.suggestedAmounts.length > 0
        ? data.suggestedAmounts
        : [501, 1116, 2500, 5000],
    category: data.category || "general",
    isActive: data.isActive ?? true,
    displayOrder: data.displayOrder ?? 1,
  };
}

export async function getActiveDonationTypes(): Promise<DonationType[]> {
  try {
    const q = query(DONATION_TYPES_COLLECTION, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const items = snapshot.docs.map(formatDonationDoc);
      return items.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return DEFAULT_DONATION_TYPES;
  } catch (error) {
    console.warn("Error fetching active donation types, using defaults:", error);
    return DEFAULT_DONATION_TYPES;
  }
}

/** Subscribe in real-time to donation categories managed in Admin Dashboard */
export function subscribeToActiveDonationTypes(
  callback: (items: DonationType[]) => void
): () => void {
  try {
    const q = query(DONATION_TYPES_COLLECTION, where("isActive", "==", true));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(formatDonationDoc);
          callback(items.sort((a, b) => a.displayOrder - b.displayOrder));
        } else {
          callback(DEFAULT_DONATION_TYPES);
        }
      },
      (error) => {
        console.warn("Real-time donation types subscription warning, using defaults:", error);
        callback(DEFAULT_DONATION_TYPES);
      }
    );
  } catch (err) {
    console.warn("Error setting up donation types listener, using defaults:", err);
    callback(DEFAULT_DONATION_TYPES);
    return () => {};
  }
}
