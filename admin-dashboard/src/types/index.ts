/** Admin document from Firestore admins collection */
export interface AdminUser {
  name: string;
  email: string;
  role: string;
  createdAt: unknown;
  updatedAt: unknown;
}

/** Auth state for the application */
export interface AuthState {
  /** Whether Firebase Auth is still initializing */
  loading: boolean;
  /** The Firebase Auth user (null if not logged in) */
  firebaseUser: import("firebase/auth").User | null;
  /** The admin document from Firestore (null if not an admin) */
  adminData: AdminUser | null;
  /** Whether the user is a verified admin */
  isAdmin: boolean;
  /** Error message if auth/admin check failed */
  error: string | null;
}

/** Sidebar navigation item */
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  enabled: boolean;
}

/** Temple Information */
export interface TempleInfo {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string; // Optional in schema
  website?: string; // Optional in schema
  timings: {
    morning: string;
    evening: string;
  };
  imageUrl?: string; // Optional in schema
  updatedAt: any; // Firestore Timestamp
}

/** Homepage Banner */
export interface Banner {
  id?: string; // Document ID (added for client-side use)
  title: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  actionUrl?: string; // Optional in schema
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

/** Service / Seva */
export interface Service {
  id?: string; // Document ID (added for client-side use)
  name: string;
  description: string;
  imageUrl?: string; // Optional in schema
  price: number;
  bookingEnabled: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

/** Service Slot */
export interface Slot {
  id?: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  bookedCount: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

/** User Booking */
export interface Booking {
  id?: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  slotId?: string; // Optional (if slot-based)
  bookingRef: string;
  bookingDate: string; // YYYY-MM-DD
  devoteeDetails?: any; // Optional map
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  createdAt: any;
  updatedAt: any;
}

/** News Article */
export interface News {
  id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  isPublished: boolean;
  publishedAt?: any;
  createdAt: any;
  updatedAt: any;
}

/** Temple Event */
export interface Event {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isPublished: boolean;
  createdAt: any;
  updatedAt: any;
}

/** User Profile */
export interface User {
  id?: string; // Firebase Auth UID
  name: string;
  phone: string;
  email?: string;
  createdAt: any;
  updatedAt: any;
}

/** Darshan Offering */
export interface Darshan {
  id?: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  bookingEnabled: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: any;
  updatedAt: any;
}

/** Donation Type / Category */
export interface DonationType {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  suggestedAmounts: number[];
  isActive: boolean;
  displayOrder: number;
  createdAt: any;
  updatedAt: any;
}

