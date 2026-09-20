import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { TempleInfo } from "../types";

const TEMPLE_DOC_REF = doc(db, "templeInfo", "main");

export const OFFICIAL_TEMPLE_INFO: TempleInfo = {
  name: "Sri Kedareshwara Ashramam",
  description:
    "Sri Kedareshwara Ashramam, guided by Kedarananda Maharaj, is a sacred place for devotion, learning, and spiritual practice. The Ashramam is home to temples where devotees gather for pujas, darshan, and spiritual guidance. Special darshan of Maharaj takes place during Amavasya and Pournami.",
  address: "Navasiddula Gutta",
  city: "Nandipet",
  state: "Nizamabad",
  pincode: "",
  phone: "+918462-271418",
  email: "services@kedari.org",
  website: "https://kedari.org",
  timings: {
    morning: "6:00 AM – 3:00 PM",
    evening: "4:00 PM – 11:00 PM",
    maharajSpecial: "Pournami & Amavasya night",
  },
};

export async function getTempleInfo(): Promise<TempleInfo> {
  try {
    const snapshot = await getDoc(TEMPLE_DOC_REF);
    if (!snapshot.exists()) {
      return OFFICIAL_TEMPLE_INFO;
    }
    const data = snapshot.data() as Partial<TempleInfo>;

    // Guarantee the official accurate timings, address, phone and email
    return {
      ...OFFICIAL_TEMPLE_INFO,
      ...data,
      name: data.name || OFFICIAL_TEMPLE_INFO.name,
      description: data.description || OFFICIAL_TEMPLE_INFO.description,
      address: "Navasiddula Gutta",
      city: "Nandipet",
      state: "Nizamabad",
      pincode: "",
      phone: "+918462-271418",
      email: "services@kedari.org",
      timings: {
        morning: "6:00 AM – 3:00 PM",
        evening: "4:00 PM – 11:00 PM",
        maharajSpecial: "Pournami & Amavasya night",
      },
      imageUrl: data.imageUrl || "",
    };
  } catch (error) {
    console.error("Error fetching temple info:", error);
    return OFFICIAL_TEMPLE_INFO;
  }
}
