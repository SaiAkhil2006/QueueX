import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getFirebaseClientConfig,
  getFirebaseAdminConfig,
} from "@/lib/firebase/config";
import { isFirebaseClientConfigured } from "@/lib/firebase/client";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { GET as getFirebaseHealth } from "@/app/api/health/firebase/route";

describe("Firebase Configuration & Initialization", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant environment variables before each test
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    delete process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Client Configuration Validation", () => {
    it("reports missing variables when environment is unconfigured", () => {
      const result = getFirebaseClientConfig();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThanOrEqual(6);
      }
      expect(isFirebaseClientConfigured()).toBe(false);
    });

    it("succeeds when all client variables are properly provided", () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "test-project.firebaseapp.com";
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-project.firebasestorage.app";
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abcdef";

      const result = getFirebaseClientConfig();
      expect(result.success).toBe(true);
      expect(isFirebaseClientConfigured()).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe("test-project");
      }
    });
  });

  describe("Admin Configuration Validation", () => {
    it("reports missing variables when admin credentials are not provided", () => {
      const result = getFirebaseAdminConfig();
      expect(result.success).toBe(false);
      expect(isFirebaseAdminConfigured()).toBe(false);
    });

    it("formats escaped newlines in private keys and validates email format", () => {
      process.env.FIREBASE_PROJECT_ID = "queuex-test";
      process.env.FIREBASE_CLIENT_EMAIL = "firebase-adminsdk@queuex-test.iam.gserviceaccount.com";
      process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC\\n-----END PRIVATE KEY-----\\n";

      const result = getFirebaseAdminConfig();
      expect(result.success).toBe(true);
      expect(isFirebaseAdminConfigured()).toBe(true);
      if (result.success) {
        expect(result.data.privateKey).toContain("\n");
        expect(result.data.privateKey).not.toContain("\\n");
        expect(result.data.clientEmail).toBe("firebase-adminsdk@queuex-test.iam.gserviceaccount.com");
      }
    });

    it("detects invalid service account email format", () => {
      process.env.FIREBASE_PROJECT_ID = "queuex-test";
      process.env.FIREBASE_CLIENT_EMAIL = "not-an-email";
      process.env.FIREBASE_PRIVATE_KEY = "key";

      const result = getFirebaseAdminConfig();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.includes("email"))).toBe(true);
      }
    });
  });

  describe("Firebase Health Check Endpoint (Unconfigured State)", () => {
    it("returns 503 status with structured unconfigured message when credentials are missing", async () => {
      const response = await getFirebaseHealth();
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.service).toBe("firebase");
      expect(json.database).toBe("firestore");
      expect(json.status).toBe("unconfigured");
      expect(json.message).toContain("Firebase Admin credentials are not configured");
      expect(json.missingVariables).toBeDefined();
    });
  });
});
