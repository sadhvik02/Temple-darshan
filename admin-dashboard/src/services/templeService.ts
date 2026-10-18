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

export async function updateMobileAnnouncementsAndVideos(params: {
  isDarshanEnabled?: boolean;
  scrollingAnnouncement?: string;
  featuredVideos?: import("../types").FeaturedVideo[];
}): Promise<void> {
  const payload: any = {
    updatedAt: serverTimestamp(),
  };
  if (params.isDarshanEnabled !== undefined) {
    payload.isDarshanEnabled = params.isDarshanEnabled;
  }
  if (params.scrollingAnnouncement !== undefined) {
    payload.scrollingAnnouncement = params.scrollingAnnouncement;
  }
  if (params.featuredVideos !== undefined) {
    payload.featuredVideos = params.featuredVideos;
    if (params.featuredVideos.length > 0) {
      payload.featuredVideoUrl = params.featuredVideos[0].videoUrl;
      payload.featuredVideoTitle = params.featuredVideos[0].title;
    } else {
      payload.featuredVideoUrl = "";
      payload.featuredVideoTitle = "";
    }
  }
  await setDoc(TEMPLE_DOC_REF, payload, { merge: true });
}

