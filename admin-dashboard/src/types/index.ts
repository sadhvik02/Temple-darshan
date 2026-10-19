/** Admin document from Firestore admins collection */
export interface AdminUser {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | string;
  permissions?: string[];
  isActive?: boolean;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt: any;
  updatedAt: any;
}

/** Admin page permission descriptor */
export interface AdminPageOption {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
}

export const AVAILABLE_ADMIN_PAGES: AdminPageOption[] = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: "📊", description: "View analytics, totals, metrics and revenue overviews" },
  { id: "temple", label: "Temple Info", path: "/temple", icon: "🛕", description: "Manage temple description, contact details and daily timings" },
  { id: "banners", label: "Banners", path: "/banners", icon: "🖼", description: "Upload, order, and toggle homepage banner images & videos" },
  { id: "darshans", label: "Darshan", path: "/darshans", icon: "🙏", description: "Configure darshan categories, dakshina tiers, and booking" },
  { id: "services", label: "Services", path: "/services", icon: "🪔", description: "Manage sacred poojas, sevas, pricing and descriptions" },
  { id: "slots", label: "Slots", path: "/slots", icon: "📅", description: "Create and schedule seva & darshan time slot capacities" },
  { id: "bookings", label: "Bookings", path: "/bookings", icon: "📋", description: "View, filter and update pilgrim seva and darshan bookings" },
  { id: "donations", label: "Donations", path: "/donations", icon: "💰", description: "Track devotee hundi, annadanam, and goshala contributions" },
  { id: "news", label: "News", path: "/news", icon: "📰", description: "Publish ashram newsletters, updates and articles" },
  { id: "events", label: "Events", path: "/events", icon: "🎉", description: "Announce upcoming temple festivals, poojas and celebrations" },
  { id: "notifications", label: "Notifications", path: "/notifications", icon: "🔔", description: "Broadcast instant push notifications to devotees' mobile app" },
  { id: "users", label: "Users", path: "/users", icon: "👥", description: "View registered devotee directory and contact records" },
];

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
  superAdminOnly?: boolean;
}

/** Featured Ashram Video for mobile home screen */
export interface FeaturedVideo {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  displayOrder?: number;
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
  imageUrl?: string; // Optional in schema (primary cover)
  images?: string[]; // Multiple temple photos displayed as swipeable carousel on mobile app
  isDarshanEnabled?: boolean; // Master toggle for Darshan module across mobile app
  scrollingAnnouncement?: string; // Marquee announcement text scrolling across mobile app
  featuredVideos?: FeaturedVideo[]; // Multiple sacred videos sliding on mobile app
  featuredVideoUrl?: string; // Backward compatibility: dedicated video URL
  featuredVideoTitle?: string; // Backward compatibility: title for dedicated video
  updatedAt: any; // Firestore Timestamp
}

/** Homepage Banner */
export interface Banner {
  id?: string; // Document ID (added for client-side use)
  title: string;
  description?: string; // Optional: detailed subtitle/description shown on banner
  imageUrl: string;
  videoUrl?: string; // Optional: direct MP4, MOV, or YouTube link
  isActive: boolean;
  displayOrder: number;
  actionUrl?: string; // Optional in schema
  verticalAlignment?: number; // 0 (top) to 100 (bottom) framing focus
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

/** Service / Seva */
export interface Service {
  id?: string; // Document ID (added for client-side use)
  name: string;
  description: string;
  category: 'ashrama_seva' | 'arjita_seva';
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
  devotees?: any[]; // Array of devotee maps
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'free';
  totalAmount: number;
  recurringGroupId?: string;
  occurrenceNumber?: number;
  totalOccurrences?: number;
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

/** Payment Transaction */
export interface Payment {
  id?: string;
  userId: string;
  sourceType: 'seva' | 'darshan' | 'donation';
  offeringId: string;
  offeringName: string;
  quantity: number;
  slotId?: string | null;
  amount: number;
  amountInr: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed' | 'refund_needed';
  bookingRef?: string;
  bookingId?: string;
  donationId?: string;
  createdAt: any;
  updatedAt: any;
}

/** Donation Transaction */
export interface Donation {
  id?: string;
  userId: string;
  donationTypeId: string;
  donationTypeName: string;
  amount: number;
  paymentId: string;
  razorpayPaymentId: string;
  status: 'pending' | 'completed' | 'failed';
  donorName: string;
  donorPhone: string;
  createdAt: any;
  updatedAt: any;
}

/** Temple Notification / Announcement */
export interface NotificationItem {
  id?: string;
  title: string;
  body: string;
  type: 'general' | 'darshan' | 'puja' | 'event' | 'urgent' | 'announcement';
  targetAudience: 'all' | 'devotees';
  imageUrl?: string;
  actionRoute?: string;
  isGlobal?: boolean;
  targetUserId?: string | null;
  sentBy?: string;
  createdAt: any;
  updatedAt?: any;
}

