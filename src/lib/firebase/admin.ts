import "server-only";

import {
  initializeApp,
  getApps,
  getApp,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminConfig } from "./config";

let cachedAdminApp: App | null = null;
let cachedAdminFirestore: Firestore | null = null;

const ADMIN_APP_NAME = "queuex-admin";

/**
 * Checks whether Firebase Admin SDK credentials are configured via environment variables
 * or standard application default credentials.
 */
export function isFirebaseAdminConfigured(): boolean {
  if (Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return true;
  }
  return getFirebaseAdminConfig().success;
}

/**
 * Initializes and returns the Firebase Admin App instance.
 * Prevents duplicate initialization across server-side Route Handlers.
 *
 * @throws Error if credentials are not configured
 */
export function getAdminApp(): App {
  // Check if an existing admin app is already registered
  const existingApp = getApps().find((a) => a.name === ADMIN_APP_NAME) || (getApps().length > 0 ? getApp() : null);
  if (existingApp) {
    return existingApp;
  }

  if (cachedAdminApp) {
    return cachedAdminApp;
  }

  // Option 1: Explicit Service Account Environment Variables
  const configResult = getFirebaseAdminConfig();
  if (configResult.success) {
    cachedAdminApp = initializeApp(
      {
        credential: cert({
          projectId: configResult.data.projectId,
          clientEmail: configResult.data.clientEmail,
          privateKey: configResult.data.privateKey,
        }),
      },
      ADMIN_APP_NAME
    );
    return cachedAdminApp;
  }

  // Option 2: Google Application Default Credentials (e.g. Firebase App Hosting / GCP)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    cachedAdminApp = initializeApp(
      {
        credential: applicationDefault(),
      },
      ADMIN_APP_NAME
    );
    return cachedAdminApp;
  }

  throw new Error(
    `Firebase Admin initialization failed due to missing credentials:\n- ${configResult.errors.join("\n- ")}\nAlternatively set GOOGLE_APPLICATION_CREDENTIALS.`
  );
}

/**
 * Returns the server-side Firebase Admin Firestore instance.
 *
 * @throws Error if credentials are not configured
 */
export function getAdminFirestore(): Firestore {
  if (cachedAdminFirestore) {
    return cachedAdminFirestore;
  }

  const app = getAdminApp();
  cachedAdminFirestore = getFirestore(app);
  return cachedAdminFirestore;
}

/**
 * Safe accessor for admin App instance. Returns null if not configured.
 */
export const adminApp: App | null = (() => {
  try {
    return isFirebaseAdminConfigured() ? getAdminApp() : null;
  } catch {
    return null;
  }
})();

/**
 * Safe accessor for admin Firestore instance. Returns null if not configured.
 */
export const adminDb: Firestore | null = (() => {
  try {
    return adminApp ? getFirestore(adminApp) : null;
  } catch {
    return null;
  }
})();

export { type App as AdminApp, type Firestore as AdminFirestore };
