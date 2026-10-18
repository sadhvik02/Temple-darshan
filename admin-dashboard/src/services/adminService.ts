import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";
import type { AdminUser } from "../types";

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "ADMIN" | "SUPER_ADMIN" | string;
  permissions?: string[];
}

export interface UpdateAdminPayload {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
  password?: string;
}

/**
 * Fetch all administrators (Firestore direct + Cloud Function fallback)
 */
export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const snap = await getDocs(collection(db, "admins"));
    const list: AdminUser[] = [];
    snap.forEach((d) => {
      list.push({
        id: d.id,
        uid: d.id,
        ...d.data(),
      } as AdminUser);
    });

    // Sort: SUPER_ADMINs first, then newest
    list.sort((a, b) => {
      const isSuperA = (a.role || "").toUpperCase() === "SUPER_ADMIN";
      const isSuperB = (b.role || "").toUpperCase() === "SUPER_ADMIN";
      if (isSuperA && !isSuperB) return -1;
      if (!isSuperA && isSuperB) return 1;
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tB - tA;
    });

    return list;
  } catch (err) {
    console.warn("Direct Firestore read for admins failed, falling back to listAdmins function:", err);
    try {
      const listAdminsFn = httpsCallable<unknown, { admins: AdminUser[] }>(functions, "listAdmins");
      const res = await listAdminsFn();
      return res.data.admins || [];
    } catch (fnErr) {
      console.error("Cloud function listAdmins also failed:", fnErr);
      throw fnErr;
    }
  }
}

/**
 * Create a new Administrator via Cloud Function
 */
export async function createAdmin(payload: CreateAdminPayload): Promise<{ success: boolean; uid: string; message: string }> {
  try {
    const createAdminFn = httpsCallable<CreateAdminPayload, { success: boolean; uid: string; message: string }>(
      functions,
      "createAdminUser"
    );
    const result = await createAdminFn(payload);
    return result.data;
  } catch (err: any) {
    console.error("Cloud Function createAdminUser error:", err);
    const message = err.message || "Failed to create administrator account.";
    throw new Error(message);
  }
}

/**
 * Update an Administrator (Role, Status, Permissions, Password)
 */
export async function updateAdmin(payload: UpdateAdminPayload): Promise<void> {
  try {
    const updateAdminFn = httpsCallable<UpdateAdminPayload, { success: boolean }>(
      functions,
      "updateAdminUser"
    );
    await updateAdminFn(payload);
  } catch (err: any) {
    console.warn("updateAdminUser function failed, falling back to direct Firestore update:", err);
    // Direct Firestore update fallback if Cloud Function is offline
    const adminRef = doc(db, "admins", payload.uid);
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };
    if (payload.name) updates.name = payload.name;
    if (payload.phone !== undefined) updates.phone = payload.phone;
    if (payload.role) updates.role = payload.role;
    if (payload.permissions) updates.permissions = payload.permissions;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;
    await updateDoc(adminRef, updates);
  }
}

/**
 * Toggle an Administrator's active state
 */
export async function toggleAdminStatus(uid: string, isActive: boolean): Promise<void> {
  return updateAdmin({ uid, isActive });
}

/**
 * Delete an Administrator
 */
export async function deleteAdmin(uid: string): Promise<void> {
  try {
    const deleteAdminFn = httpsCallable<{ uid: string }, { success: boolean }>(
      functions,
      "deleteAdminUser"
    );
    await deleteAdminFn({ uid });
  } catch (err: any) {
    console.warn("deleteAdminUser function failed, falling back to direct Firestore deletion:", err);
    await deleteDoc(doc(db, "admins", uid));
  }
}
