import { NextResponse } from "next/server";
import {
  isFirebaseAdminConfigured,
  getAdminFirestore,
} from "@/lib/firebase/admin";
import { getFirebaseAdminConfig } from "@/lib/firebase/config";

export async function GET() {
  // Step 1: Check if credentials are provided in the environment
  if (!isFirebaseAdminConfigured()) {
    const configResult = getFirebaseAdminConfig();
    return NextResponse.json(
      {
        success: false,
        service: "firebase",
        database: "firestore",
        status: "unconfigured",
        message:
          "Firebase Admin credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local",
        missingVariables: configResult.success ? [] : configResult.errors,
      },
      { status: 503 }
    );
  }

  // Step 2: Attempt a harmless connectivity check to Firestore
  try {
    const db = getAdminFirestore();
    // Non-destructive read check: querying a non-existent document or empty collection
    // verifies authentication and network connectivity without writing or mutating data.
    await db.collection("_health_check").limit(1).get();

    return NextResponse.json({
      success: true,
      service: "firebase",
      database: "firestore",
      status: "connected",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error during Firestore connectivity check";

    // Return sanitized error without leaking private keys or raw tokens
    return NextResponse.json(
      {
        success: false,
        service: "firebase",
        database: "firestore",
        status: "disconnected",
        message,
      },
      { status: 502 }
    );
  }
}
