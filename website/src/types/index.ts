/** Temple Information model matching Firestore 'templeInfo/main' */
export interface TempleInfo {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  website?: string;
  timings: {
    morning: string;
    evening: string;
    maharajSpecial?: string;
  };
  imageUrl?: string;
  updatedAt?: any;
}

/** Homepage Banner model matching 'banners' collection */
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  actionUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** Seva / Service model matching 'services' collection */
export interface Service {
  id: string;
  name: string;
  description: string;
  category: 'ashrama_seva' | 'arjita_seva';
  imageUrl?: string;
  price: number;
  bookingEnabled: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: any;
  updatedAt?: any;
}

/** Darshan offering model matching 'darshans' collection */
export interface Darshan {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  bookingEnabled: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: any;
  updatedAt?: any;
}

/** Donation Type category model matching 'donationTypes' collection */
export interface DonationType {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  suggestedAmounts: number[];
  isActive: boolean;
  displayOrder: number;
  createdAt?: any;
  updatedAt?: any;
}

/** News article model matching 'news' collection */
export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isPublished: boolean;
  publishedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

/** Temple Event model matching 'events' collection */
export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  isPublished: boolean;
  createdAt?: any;
  updatedAt?: any;
}
