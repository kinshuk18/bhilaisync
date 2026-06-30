// ---------------------------------------------------------------------------
// firebase-types.ts
// Pure shared constants and TypeScript interfaces for BhilaiSync.
//
// NO Firebase SDK imports. NO process.env reads. NO side effects.
// Safe to import from Server Components, Route Handlers, and Edge functions
// without pulling in the client-side Firebase SDK or triggering env-var
// validation that only applies to the browser bundle.
//
// Client-side code should still import from "@/lib/firebase" which re-exports
// everything here alongside the live SDK instances (db, auth, app).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Type-safe Firestore collection path constants
// ---------------------------------------------------------------------------
export const COLLECTIONS = {
  USERS:                 "users",
  CAFE_MENU:             "cafe_menu",
  CAFE_ORDERS:           "cafe_orders",
  MARKETPLACE_LISTINGS:  "marketplace_listings",
  NAVIGATOR_LOGS:        "navigator_logs",
} as const;

export type CollectionName =
  (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// ---------------------------------------------------------------------------
// Shared TypeScript interfaces for Firestore document shapes
// ---------------------------------------------------------------------------

/** Stored under /users/{uid} */
export interface UserDocument {
  uid:         string;
  email:       string;
  displayName: string;
  role:        "student" | "admin" | "cafe_staff";
  isVerified:  boolean;
  createdAt:   number; // Unix ms — Firestore serverTimestamp resolved to number on read
}

/** Stored under /cafe_menu/{itemId} */
export interface CafeMenuItemDocument {
  itemId:      string;
  name:        string;
  description: string;
  price:       number; // INR, stored as integer paise or decimal rupees
  isAvailable: boolean;
  category:    "beverages" | "snacks" | "meals" | "desserts" | string;
}

/** Line-item inside a cafe order */
export interface CafeOrderItem {
  itemId:   string;
  name:     string;
  price:    number;
  quantity: number;
}

/** Stored under /cafe_orders/{orderId} */
export interface CafeOrderDocument {
  orderId:         string;
  studentId:       string;
  items:           CafeOrderItem[];
  totalAmount:     number;
  status:          "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  scheduledPickup: string; // ISO-8601 datetime string
  createdAt:       number;
}

/** Stored under /marketplace_listings/{listingId} */
export interface MarketplaceListingDocument {
  listingId:   string;
  sellerId:    string;
  title:       string;
  description: string;
  aiSummary:   string;
  price:       number;
  condition:   "new" | "like_new" | "good" | "fair" | "poor";
  imageUrl:    string;
  status:      "active" | "sold" | "removed";
  createdAt:   number;
}

/** Stored under /navigator_logs/{logId} */
export interface NavigatorLogDocument {
  logId:      string;
  studentId:  string;
  query:      string;
  aiResponse: string;
  timestamp:  number;
}
