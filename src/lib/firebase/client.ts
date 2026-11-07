import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseClientConfig, type FirebaseClientConfig } from "./config";

let cachedApp: FirebaseApp | null = null;
let cachedFirestore: Firestore | null = null;

/**
 * Checks whether all required Firebase client environment variables are set.
 */
export function isFirebaseClientConfigured(): boolean {
  return getFirebaseClientConfig().success;
}

/**
 * Initializes and returns the Firebase Client App instance.
 * Prevents duplicate initialization during Next.js hot reloads.
 *
 * @throws Error if required environment variables are missing
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  if (cachedApp) {
    return cachedApp;
  }

  const configResult = getFirebaseClientConfig();
  if (!configResult.success) {
    throw new Error(
      `Firebase Client initialization failed due to missing configuration:\n- ${configResult.errors.join("\n- ")}`
    );
  }

  cachedApp = initializeApp(configResult.data);
  return cachedApp;
}

/**
 * Returns the client-side Cloud Firestore instance.
 *
 * @throws Error if required environment variables are missing
 */
export function getFirestoreInstance(): Firestore {
  if (cachedFirestore) {
    return cachedFirestore;
  }

  const app = getFirebaseApp();
  cachedFirestore = getFirestore(app);
  return cachedFirestore;
}

/**
 * Exported app instance for environments where configuration is provided.
 * Returns null if client environment variables have not yet been configured.
 */
export const app: FirebaseApp | null = (() => {
  try {
    return getApps().length > 0 ? getApp() : isFirebaseClientConfigured() ? getFirebaseApp() : null;
  } catch {
    return null;
  }
})();

/**
 * Exported Firestore instance for environments where configuration is provided.
 * Returns null if client environment variables have not yet been configured.
 */
export const db: Firestore | null = app ? getFirestore(app) : null;

export { type FirebaseApp, type Firestore, type FirebaseClientConfig };
