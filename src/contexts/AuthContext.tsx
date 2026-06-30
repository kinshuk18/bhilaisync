"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  AuthError,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { auth, db, COLLECTIONS, UserDocument } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ALLOWED_DOMAIN = "iitbhilai.ac.in";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AuthContextValue {
  /** Raw Firebase Auth user — null when signed out or loading */
  user: User | null;
  /** Firestore UserDocument for the signed-in user — null when absent */
  userData: UserDocument | null;
  /** True while the initial auth state is being resolved */
  loading: boolean;
  /** Non-null when sign-in or domain validation fails */
  authError: string | null;
  /** Clears the current authError */
  clearAuthError: () => void;
  /** Triggers Google OAuth popup with @iitbhilai.ac.in domain enforcement */
  signInWithGoogle: () => Promise<void>;
  /** Signs the current user out of Firebase Auth */
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Domain validation helper
// ---------------------------------------------------------------------------
function isIITBhilaiEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

// ---------------------------------------------------------------------------
// Firestore user document helpers
// ---------------------------------------------------------------------------
async function fetchUserDocument(uid: string): Promise<UserDocument | null> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserDocument;
}

async function createUserDocument(user: User): Promise<UserDocument> {
  const now = Date.now();
  const newDoc: UserDocument = {
    uid:         user.uid,
    email:       user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "IIT Bhilai Student",
    role:        "student",
    isVerified:  true,
    createdAt:   now,
  };

  const ref = doc(db, COLLECTIONS.USERS, user.uid);
  // We use serverTimestamp only for the Firestore-side field; the in-memory
  // object retains the local `now` value so we can return a typed UserDocument
  // immediately without a round-trip read.
  await setDoc(ref, {
    ...newDoc,
    createdAt: serverTimestamp(),
  });

  return newDoc;
}

async function ensureUserDocument(user: User): Promise<UserDocument> {
  const existing = await fetchUserDocument(user.uid);
  if (existing) return existing;
  return createUserDocument(user);
}

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser]           = useState<User | null>(null);
  const [userData, setUserData]   = useState<UserDocument | null>(null);
  const [loading, setLoading]     = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Ref to the active Firestore real-time listener so we can unsubscribe
  // cleanly when the user signs out or the component unmounts.
  const userDocUnsubRef = useRef<Unsubscribe | null>(null);

  // ---------------------------------------------------------------------------
  // Subscribe to Firestore UserDocument in real time
  // Called once a validated Firebase Auth user is confirmed. Sets up an
  // onSnapshot listener so role/verification changes propagate instantly.
  // ---------------------------------------------------------------------------
  const subscribeToUserDoc = useCallback((uid: string): void => {
    // Tear down any previous subscription before creating a new one.
    if (userDocUnsubRef.current) {
      userDocUnsubRef.current();
      userDocUnsubRef.current = null;
    }

    const ref = doc(db, COLLECTIONS.USERS, uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data() as UserDocument);
        } else {
          // Document may have been deleted externally; clear local state.
          setUserData(null);
        }
      },
      (error) => {
        console.error("[AuthContext] Firestore snapshot error:", error);
        setUserData(null);
      }
    );

    userDocUnsubRef.current = unsub;
  }, []);

  // ---------------------------------------------------------------------------
  // Teardown helper — sign out and clean up all subscriptions / state
  // ---------------------------------------------------------------------------
  const teardown = useCallback((): void => {
    if (userDocUnsubRef.current) {
      userDocUnsubRef.current();
      userDocUnsubRef.current = null;
    }
    setUser(null);
    setUserData(null);
  }, []);

  // ---------------------------------------------------------------------------
  // onAuthStateChanged listener
  // Fires on every Auth state transition: initial load, sign-in, sign-out,
  // and token refresh. We use it as the single source of truth for `user`.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (!firebaseUser) {
            teardown();
            return;
          }

          // Secondary domain guard: catches edge cases where a session is
          // restored from a cached token after the domain policy was added.
          if (!isIITBhilaiEmail(firebaseUser.email)) {
            console.warn(
              "[AuthContext] Cached session has non-IIT Bhilai email — forcing sign-out.",
              firebaseUser.email
            );
            await signOut(auth);
            setAuthError(
              `Access restricted to @${ALLOWED_DOMAIN} accounts. ` +
                `Please sign in with your IIT Bhilai Google account.`
            );
            teardown();
            return;
          }

          // Ensure the Firestore document exists (creates it on first login).
          await ensureUserDocument(firebaseUser);

          setUser(firebaseUser);

          // Start real-time listener for the user doc.
          subscribeToUserDoc(firebaseUser.uid);
        } catch (err) {
          console.error("[AuthContext] onAuthStateChanged handler error:", err);
          setAuthError(
            "An unexpected error occurred while restoring your session. Please try signing in again."
          );
          teardown();
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("[AuthContext] onAuthStateChanged observer error:", error);
        setAuthError("Authentication service error. Please refresh and try again.");
        teardown();
        setLoading(false);
      }
    );

    return () => {
      unsubAuth();
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }
    };
  }, [teardown, subscribeToUserDoc]);

  // ---------------------------------------------------------------------------
  // signInWithGoogle
  // Opens the Google OAuth popup, enforces the @iitbhilai.ac.in domain
  // restriction, then upserts the Firestore user document.
  // ---------------------------------------------------------------------------
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    setAuthError(null);

    const provider = new GoogleAuthProvider();

    // Hint to Google's consent screen to show only @iitbhilai.ac.in accounts.
    // This is a UX hint only — server-side enforcement is done below.
    provider.setCustomParameters({
      hd: ALLOWED_DOMAIN,
      prompt: "select_account",
    });

    // Request the profile and email scopes explicitly.
    provider.addScope("profile");
    provider.addScope("email");

    let credential;
    try {
      credential = await signInWithPopup(auth, provider);
    } catch (err) {
      const firebaseErr = err as AuthError;

      // User closed the popup — not an error worth surfacing.
      if (
        firebaseErr.code === "auth/popup-closed-by-user" ||
        firebaseErr.code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      if (firebaseErr.code === "auth/popup-blocked") {
        setAuthError(
          "Sign-in popup was blocked by your browser. " +
            "Please allow popups for this site and try again."
        );
        return;
      }

      if (firebaseErr.code === "auth/network-request-failed") {
        setAuthError(
          "Network error during sign-in. Please check your connection and try again."
        );
        return;
      }

      console.error("[AuthContext] signInWithPopup error:", firebaseErr);
      setAuthError(
        `Sign-in failed: ${firebaseErr.message ?? "Unknown error"}. Please try again.`
      );
      return;
    }

    const signedInUser = credential.user;

    // ---------------------------------------------------------------------------
    // CRITICAL: Enforce @iitbhilai.ac.in domain restriction
    // The `hd` parameter above is a UI hint only. Google does NOT guarantee that
    // the returned account matches the hosted domain — a user can bypass it by
    // clicking "Use another account". We MUST validate server-side here.
    // ---------------------------------------------------------------------------
    if (!isIITBhilaiEmail(signedInUser.email)) {
      // Immediately revoke the session so it cannot be reused.
      try {
        await signOut(auth);
      } catch (signOutErr) {
        console.error(
          "[AuthContext] Failed to sign out non-IIT Bhilai user:",
          signOutErr
        );
      }

      setAuthError(
        `Access denied. Only @${ALLOWED_DOMAIN} Google accounts are permitted. ` +
          `You signed in as "${signedInUser.email ?? "unknown"}". ` +
          `Please use your official IIT Bhilai email.`
      );

      // Ensure local state is clean.
      teardown();
      return;
    }

    // Domain validated. The onAuthStateChanged listener will handle the rest
    // (ensureUserDocument + subscribeToUserDoc + state updates), so we do
    // not duplicate that logic here. The flow continues asynchronously.
  }, [teardown]);

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------
  const logout = useCallback(async (): Promise<void> => {
    setAuthError(null);
    try {
      await signOut(auth);
      // teardown() will be called by the onAuthStateChanged observer reacting
      // to the sign-out event. Calling it here too is safe due to the null
      // guard on the unsubscribe ref, but unnecessary.
    } catch (err) {
      console.error("[AuthContext] logout error:", err);
      setAuthError("Sign-out failed. Please try again.");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // clearAuthError
  // ---------------------------------------------------------------------------
  const clearAuthError = useCallback((): void => {
    setAuthError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Context value — memoised to prevent unnecessary re-renders of consumers
  // ---------------------------------------------------------------------------
  const value: AuthContextValue = {
    user,
    userData,
    loading,
    authError,
    clearAuthError,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// useAuth hook
// Throws at call-site if used outside of AuthProvider — prevents silent bugs
// where a component reads a stale null instead of the real auth state.
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error(
      "[BhilaiSync] useAuth() must be called inside an <AuthProvider>. " +
        "Ensure your component tree is wrapped with <AuthProvider> in app/layout.tsx."
    );
  }
  return context;
}

export type { AuthContextValue };