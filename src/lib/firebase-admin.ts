import {
  initializeApp,
  getApps,
  getApp,
  cert,
  App,
  ServiceAccount,
} from "firebase-admin/app";
import {
  getFirestore,
  Firestore,
} from "firebase-admin/firestore";
import {
  getAuth,
  Auth,
} from "firebase-admin/auth";

// ---------------------------------------------------------------------------
// Environment variable validation
// Admin credentials must never be exposed to the client. These variables are
// intentionally non-prefixed (no NEXT_PUBLIC_) so Next.js keeps them
// server-side only. Fail loudly at module load time rather than at the point
// of first use, so misconfigured deployments surface immediately.
// ---------------------------------------------------------------------------
const requiredAdminEnvVars = [
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
] as const;

// This loop actually uses the variable, satisfying the compiler 
// and fulfilling your "Fail loudly" requirement!
requiredAdminEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`MISSING CONFIG: Environment variable ${envVar} is not set.`);
  }
});

type RequiredAdminEnvVar = (typeof requiredAdminEnvVars)[number];

function assertAdminEnvVar(key: RequiredAdminEnvVar): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[BhilaiSync Admin] Missing required server-side environment variable: ${key}.\n` +
        `Ensure your .env.local file contains this key and the Next.js server has been restarted.\n` +
        `This variable must NOT have the NEXT_PUBLIC_ prefix — it is intentionally server-only.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Private key normalisation
// When a PEM private key is stored in a .env file or injected via a CI/CD
// secret manager, the literal two-character sequence \n (backslash + n) is
// commonly used to represent actual newline characters. Firebase Admin SDK
// requires the real newlines in the PEM block, so we replace every \\n
// occurrence with a true \n here. We also strip any surrounding double-quotes
// that some secret managers wrap around the value.
// ---------------------------------------------------------------------------
function normalisePrivateKey(raw: string): string {
  return raw
    .replace(/^"|"$/g, "")   // strip wrapping double-quotes if present
    .replace(/\\n/g, "\n");  // convert escaped newlines to real newlines
}

// ---------------------------------------------------------------------------
// Build the service account credential object
// ---------------------------------------------------------------------------
const projectId:   string = assertAdminEnvVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const clientEmail: string = assertAdminEnvVar("FIREBASE_CLIENT_EMAIL");
const privateKey:  string = normalisePrivateKey(assertAdminEnvVar("FIREBASE_PRIVATE_KEY"));

const serviceAccount: ServiceAccount = {
  projectId,
  clientEmail,
  privateKey,
};

// ---------------------------------------------------------------------------
// Singleton initialisation
// Next.js hot-module replacement (HMR) in development re-evaluates server
// modules, which would cause initializeApp() to be called again on an already-
// initialised SDK and throw:
//   "The default Firebase app already exists."
// We guard against this by reusing the existing app when one is present.
// The Admin SDK uses a separate app registry from the client SDK, so there is
// no cross-contamination between lib/firebase.ts and this module.
// ---------------------------------------------------------------------------
const ADMIN_APP_NAME = "bhilaisync-admin";

function getAdminApp(): App {
  const existingApps = getApps();
  const existingAdmin = existingApps.find((a) => a.name === ADMIN_APP_NAME);
  if (existingAdmin) {
    return getApp(ADMIN_APP_NAME);
  }
  return initializeApp(
    {
      credential: cert(serviceAccount),
      projectId,
    },
    ADMIN_APP_NAME
  );
}

const adminApp: App = getAdminApp();

// ---------------------------------------------------------------------------
// Service instances derived from the singleton admin app
// ---------------------------------------------------------------------------
const adminDb:   Firestore = getFirestore(adminApp);
const adminAuth: Auth      = getAuth(adminApp);

// ---------------------------------------------------------------------------
// Firestore settings
// preferRest: true routes all Admin SDK Firestore calls over HTTP/1.1 REST
// rather than gRPC. This is recommended for Next.js API routes and Edge
// functions running in serverless environments where long-lived gRPC streams
// can cause cold-start timeouts and GOAWAY errors under AWS Lambda / Vercel.
// ---------------------------------------------------------------------------
adminDb.settings({
  preferRest: true,
  ignoreUndefinedProperties: true,
});

// ---------------------------------------------------------------------------
// Development diagnostics
// Log once on first initialisation so it is easy to confirm the admin SDK
// wired up correctly when running locally.
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === "development") {
  console.info(
    `[BhilaiSync Admin] 🔑 Firebase Admin SDK initialised.\n` +
      `  Project  : ${projectId}\n` +
      `  Account  : ${clientEmail}\n` +
      `  App name : ${ADMIN_APP_NAME}`
  );
}

// ---------------------------------------------------------------------------
// Shared helper — convert a Firestore Admin Timestamp or server timestamp
// to a Unix millisecond integer. API routes can use this to serialise
// Timestamp fields before sending JSON responses to the client.
// ---------------------------------------------------------------------------
export function timestampToMs(
  value: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | number | undefined | null
): number {
  if (value == null) return Date.now();
  if (typeof value === "number") return value;
  if (
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as FirebaseFirestore.Timestamp).toMillis === "function"
  ) {
    return (value as FirebaseFirestore.Timestamp).toMillis();
  }
  return Date.now();
}

// ---------------------------------------------------------------------------
// Shared helper — generate a collision-resistant document ID that matches
// the format used by Firestore's own auto-ID algorithm (20 random chars from
// the base62 alphabet). Using this on the server lets us set the document ID
// and embed it as a field in the same write operation atomically.
// ---------------------------------------------------------------------------
const AUTO_ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateFirestoreId(length = 20): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += AUTO_ID_CHARS.charAt(
      Math.floor(Math.random() * AUTO_ID_CHARS.length)
    );
  }
  return result;
}

// ---------------------------------------------------------------------------
// Named exports
// Server-only — import these only inside:
//   • app/api/**/route.ts
//   • app/**/page.tsx  (server components with 'use server' data fetching)
//   • middleware.ts
// Never import this file from a client component or any path that could be
// bundled by the browser; doing so would leak your service account credentials.
// ---------------------------------------------------------------------------
export { adminApp, adminDb, adminAuth };
