import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { TempleInfo } from "../types";

const TEMPLE_DOC_REF = doc(db, "templeInfo", "main");

export async function getTempleInfo(): Promise<TempleInfo | null> {
  try {
    const snapshot = await getDoc(TEMPLE_DOC_REF);
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.data() as TempleInfo;
  } catch (error) {
    console.error("Error fetching temple info:", error);
    return null;
  }
}
