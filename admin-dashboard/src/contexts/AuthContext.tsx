import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { AdminUser, AuthState } from "../types";

export interface AuthContextValue extends AuthState {
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    firebaseUser: null,
    adminData: null,
    isAdmin: false,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        // No user logged in
        setState({
          loading: false,
          firebaseUser: null,
          adminData: null,
          isAdmin: false,
          error: null,
        });
        return;
      }

      // User is authenticated — check admin authorization
      try {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
          const adminData = adminDoc.data() as AdminUser;
          setState({
            loading: false,
            firebaseUser: user,
            adminData,
            isAdmin: true,
            error: null,
          });
        } else {
          // Authenticated but NOT an admin
          setState({
            loading: false,
            firebaseUser: user,
            adminData: null,
            isAdmin: false,
            error: null,
          });
        }
      } catch (err) {
        console.error("Admin verification failed:", err);
        setState({
          loading: false,
          firebaseUser: user,
          adminData: null,
          isAdmin: false,
          error: "Failed to verify admin authorization. Please try again.",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // State will be updated by onAuthStateChanged listener
    } catch (err) {
      console.error("Logout failed:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

