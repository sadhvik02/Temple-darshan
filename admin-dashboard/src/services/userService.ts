import { 
  collection, 
  getDocs, 
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { User } from "../types";

const USERS_COLLECTION = collection(db, "users");

export async function getUsers(): Promise<User[]> {
  const q = query(
    USERS_COLLECTION, 
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[];
}
