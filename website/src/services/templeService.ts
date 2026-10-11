import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { TempleInfo } from "../types";

const TEMPLE_DOC_REF = doc(db, "templeInfo", "main");

export const OFFICIAL_TEMPLE_INFO: TempleInfo = {
  name: "Sri Kedareshwara Ashramam",
  description:
    "Sri Kedareshwara Ashramam, guided by Kedarananda Maharaj, is a sacred place for devotion, learning, and spiritual practice situated atop Navasiddula Gutta, Nandipet, Nizamabad.",
  address: "Navasiddula Gutta, Nandipet",
  city: "Nizamabad",
  state: "Telangana",
  pincode: "503212",
  phone: "+918462-271418",
  email: "services@kedari.org",
  website: "https://share.google/G9WLACAV3T4mh4vaK",
  timings: {
    morning: "6:00 AM – 3:00 PM",
    evening: "4:00 PM – 11:00 PM",
    maharajSpecial: "Pournami & Amavasya night",
  },
};

function mapTempleDoc(data: Partial<TempleInfo> | undefined): TempleInfo {
  if (!data) return OFFICIAL_TEMPLE_INFO;
  return {
    name: data.name !== undefined && data.name !== "" ? data.name : OFFICIAL_TEMPLE_INFO.name,
    description: data.description !== undefined && data.description !== "" ? data.description : OFFICIAL_TEMPLE_INFO.description,
    address: data.address !== undefined && data.address !== "" ? data.address : OFFICIAL_TEMPLE_INFO.address,
    city: data.city !== undefined && data.city !== "" ? data.city : OFFICIAL_TEMPLE_INFO.city,
    state: data.state !== undefined && data.state !== "" ? data.state : OFFICIAL_TEMPLE_INFO.state,
    pincode: data.pincode !== undefined ? data.pincode : OFFICIAL_TEMPLE_INFO.pincode,
    phone: data.phone !== undefined && data.phone !== "" ? data.phone : OFFICIAL_TEMPLE_INFO.phone,
    email: data.email !== undefined && data.email !== "" ? data.email : OFFICIAL_TEMPLE_INFO.email,
    website: data.website !== undefined && data.website !== "" ? data.website : OFFICIAL_TEMPLE_INFO.website,
    timings: {
      morning: data.timings?.morning || OFFICIAL_TEMPLE_INFO.timings.morning,
      evening: data.timings?.evening || OFFICIAL_TEMPLE_INFO.timings.evening,
      maharajSpecial: data.timings?.maharajSpecial || OFFICIAL_TEMPLE_INFO.timings.maharajSpecial,
    },
    imageUrl: data.imageUrl || OFFICIAL_TEMPLE_INFO.imageUrl,
  };
}

export async function getTempleInfo(): Promise<TempleInfo> {
  try {
    const snapshot = await getDoc(TEMPLE_DOC_REF);
    if (!snapshot.exists()) {
      return OFFICIAL_TEMPLE_INFO;
    }
    return mapTempleDoc(snapshot.data() as Partial<TempleInfo>);
  } catch (error) {
    console.error("Error fetching temple info:", error);
    return OFFICIAL_TEMPLE_INFO;
  }
}

/** Subscribe in real-time to changes saved in Admin Dashboard */
export function subscribeToTempleInfo(callback: (info: TempleInfo) => void): () => void {
  try {
    return onSnapshot(
      TEMPLE_DOC_REF,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(mapTempleDoc(snapshot.data() as Partial<TempleInfo>));
        } else {
          callback(OFFICIAL_TEMPLE_INFO);
        }
      },
      (error) => {
        console.error("Error in real-time temple info subscription:", error);
      }
    );
  } catch (err) {
    console.error("Error setting up temple info listener:", err);
    return () => {};
  }
}
