import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Try loading local environment files if running in Node
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // .env.local not found or inaccessible; continue
  }
  try {
    process.loadEnvFile(".env");
  } catch {
    // .env not found; continue
  }
}

const SEED_ADMIN_APP_NAME = "queuex-seed-admin";

export interface FirestoreConnectionResult {
  db: Firestore | null;
  projectId: string | null;
  reason?: string;
}

/**
 * Initializes and returns a Firestore Admin connection for the seed script.
 * Returns null if required credentials or emulator settings are missing.
 */
export function getSeedFirestore(): FirestoreConnectionResult {
  // If Firestore emulator is running, we can connect directly
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const existing = getApps().find((a) => a.name === SEED_ADMIN_APP_NAME);
    const app: App =
      existing ??
      initializeApp(
        {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "queuex-emulator",
        },
        SEED_ADMIN_APP_NAME
      );
    return {
      db: getFirestore(app),
      projectId: app.options.projectId ?? "queuex-emulator",
    };
  }

  // Check explicit service account credentials
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey
      .replace(/^['"]|['"]$/g, "")
      .replace(/\\n/g, "\n")
      .trim();

    if (!privateKey.includes("BEGIN PRIVATE KEY")) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    try {
      const existing = getApps().find((a) => a.name === SEED_ADMIN_APP_NAME);
      const app: App =
        existing ??
        initializeApp(
          {
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          },
          SEED_ADMIN_APP_NAME
        );
      return {
        db: getFirestore(app),
        projectId,
      };
    } catch (err) {
      return {
        db: null,
        projectId: null,
        reason: `Failed to initialize Firebase Admin with service account: ${(err as Error).message}`,
      };
    }
  }

  // Check Google Application Default Credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const existing = getApps().find((a) => a.name === SEED_ADMIN_APP_NAME);
      const app: App =
        existing ??
        initializeApp(
          {
            credential: applicationDefault(),
          },
          SEED_ADMIN_APP_NAME
        );
      return {
        db: getFirestore(app),
        projectId: projectId ?? "default",
      };
    } catch (err) {
      return {
        db: null,
        projectId: null,
        reason: `Failed to initialize with GOOGLE_APPLICATION_CREDENTIALS: ${(err as Error).message}`,
      };
    }
  }

  return {
    db: null,
    projectId: null,
    reason:
      "Firebase Admin credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local, or start the Firestore emulator (FIRESTORE_EMULATOR_HOST).",
  };
}
