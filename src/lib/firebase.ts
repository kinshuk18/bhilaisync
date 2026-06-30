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
// Firebase client configuration
// IMPORTANT: NEXT_PUBLIC_* variables MUST be referenced with static literal
// strings so Next.js can inline them at compile time. Dynamic bracket access
// (process.env[key] where key is a runtime variable) is NOT replaced by the
// Next.js compiler and resolves to undefined in the browser bundle.
// ---------------------------------------------------------------------------

// Static lookup — each key is a compile-time literal so Next.js inlines it.
const ENV = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

// Validate at module load time so any missing var fails loudly.
for (const [field, value] of Object.entries(ENV)) {
  if (!value || value.trim() === "") {
    throw new Error(
      `[BhilaiSync] Missing required environment variable: NEXT_PUBLIC_FIREBASE_${field.toUpperCase()}.\n` +
        `Ensure your .env.local file is populated and the Next.js dev server has been restarted.`
    );
  }
}

const firebaseConfig = {
  apiKey:            ENV.apiKey!,
  authDomain:        ENV.authDomain!,
  projectId:         ENV.projectId!,
  storageBucket:     ENV.storageBucket!,
  messagingSenderId: ENV.messagingSenderId!,
  appId:             ENV.appId!,
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
// Re-export all pure constants and interfaces from the side-effect-free
// firebase-types module. Route Handlers and Server Components should import
// directly from "@/lib/firebase-types" to avoid pulling in the client SDK.
// Client-side code may continue to import from "@/lib/firebase" as before.
// ---------------------------------------------------------------------------
export * from "@/lib/firebase-types";

// ---------------------------------------------------------------------------
// Named exports — Firebase SDK service instances
// Import these wherever live Firebase services are needed:
//   import { db, auth, COLLECTIONS } from "@/lib/firebase";
// ---------------------------------------------------------------------------
export { app, db, auth };