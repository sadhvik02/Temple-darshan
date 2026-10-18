import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { TempleInfo } from "../types";

const TEMPLE_DOC_REF = doc(db, "templeInfo", "main");

export async function getTempleInfo(): Promise<TempleInfo | null> {
  const snapshot = await getDoc(TEMPLE_DOC_REF);
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as TempleInfo;
}

export async function updateTempleInfo(data: Partial<TempleInfo>): Promise<void> {
  await setDoc(TEMPLE_DOC_REF, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function toggleDarshanStatus(enabled: boolean): Promise<void> {
  await setDoc(TEMPLE_DOC_REF, {
    isDarshanEnabled: enabled,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

