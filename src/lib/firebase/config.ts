import { z } from "zod";

/**
 * Validation schema for client-side Firebase environment variables.
 */
export const firebaseClientConfigSchema = z.object({
  apiKey: z.string().min(1, "NEXT_PUBLIC_FIREBASE_API_KEY is required"),
  authDomain: z.string().min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required"),
  projectId: z.string().min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),
  storageBucket: z.string().min(1, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required"),
  messagingSenderId: z.string().min(1, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required"),
  appId: z.string().min(1, "NEXT_PUBLIC_FIREBASE_APP_ID is required"),
});

export type FirebaseClientConfig = z.infer<typeof firebaseClientConfigSchema>;

/**
 * Validation schema for server-side Firebase Admin environment variables.
 */
export const firebaseAdminConfigSchema = z.object({
  projectId: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  clientEmail: z.string().email("FIREBASE_CLIENT_EMAIL must be a valid service account email"),
  privateKey: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),
});

export type FirebaseAdminConfig = z.infer<typeof firebaseAdminConfigSchema>;

/**
 * Reads and validates client-side Firebase configuration.
 */
export function getFirebaseClientConfig():
  | { success: true; data: FirebaseClientConfig }
  | { success: false; errors: string[] } {
  const rawConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  const result = firebaseClientConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message);
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Reads and validates server-side Firebase Admin configuration.
 */
export function getFirebaseAdminConfig():
  | { success: true; data: FirebaseAdminConfig }
  | { success: false; errors: string[] } {
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";
  // Strip optional quotes and parse escaped newlines
  const formattedPrivateKey = rawPrivateKey
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "\n");

  const rawConfig = {
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: formattedPrivateKey,
  };

  const result = firebaseAdminConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message);
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
