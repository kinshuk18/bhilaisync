import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getAuth,
  Auth,
  connectAuthEmulator,
} from "firebase/auth";

// ---------------------------------------------------------------------------
// Environment variable validation
// Fail loudly at startup if any required config key is missing, so the
// developer sees a clear error rather than a cryptic Firebase exception.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

function assertEnvVar(key: RequiredEnvVar): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[BhilaiSync] Missing required environment variable: ${key}.\n` +
        `Ensure your .env.local file is populated and the Next.js dev server has been restarted.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Firebase client configuration
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            assertEnvVar("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain:        assertEnvVar("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId:         assertEnvVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket:     assertEnvVar("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: assertEnvVar("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId:             assertEnvVar("NEXT_PUBLIC_FIREBASE_APP_ID"),
} as const;

// ---------------------------------------------------------------------------
// Singleton initialisation
// getApps() returns all currently registered Firebase apps.
// If one already exists (e.g. due to Next.js Hot Module Replacement or a
// server component re-render), we reuse it instead of calling initializeApp
// again — which would throw "Firebase: Firebase App named '[DEFAULT]'
// already exists".
// ---------------------------------------------------------------------------
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ---------------------------------------------------------------------------
// Service instances
// Both are derived from the same singleton app, so there is exactly one
// Firestore connection and one Auth session per browser tab / server worker.
// ---------------------------------------------------------------------------
const db: Firestore = getFirestore(app);
const auth: Auth     = getAuth(app);

// ---------------------------------------------------------------------------
// Local emulator wiring (development only)
// Set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in .env.local to route all
// Firestore and Auth traffic through the Firebase Local Emulator Suite
// instead of production. This guard is intentionally narrow so emulator
// connections are never accidentally established in CI or production.
// ---------------------------------------------------------------------------
if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
  typeof window !== "undefined" &&
  process.env.NODE_ENV !== "production"
) {
  const EMULATOR_HOST = "127.0.0.1";

  // connectFirestoreEmulator throws if called more than once on the same
  // instance, so we check a custom flag we attach to the db object.
  const firestoreDb = db as Firestore & { _emulatorConnected?: boolean };
  if (!firestoreDb._emulatorConnected) {
    connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
    firestoreDb._emulatorConnected = true;
  }

  // connectAuthEmulator similarly errors on duplicate calls.
  const authInstance = auth as Auth & { _emulatorConnected?: boolean };
  if (!authInstance._emulatorConnected) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
      disableWarnings: false,
    });
    authInstance._emulatorConnected = true;
  }

  if (process.env.NODE_ENV === "development") {
    console.info(
      "[BhilaiSync] 🔧 Firebase emulators active — " +
        "Firestore → :8080  |  Auth → :9099"
    );
  }
}

// ---------------------------------------------------------------------------
// Type-safe Firestore collection path constants
// Centralising these here eliminates magic strings across the codebase and
// makes collection renames a single-line change.
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
// Defining them here (rather than in a separate types/ file) keeps the
// schema single-sourced alongside the collection constants.
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

// ---------------------------------------------------------------------------
// Named exports
// Import these wherever Firebase services are needed:
//   import { db, auth, COLLECTIONS } from "@/lib/firebase";
// ---------------------------------------------------------------------------
export { app, db, auth };