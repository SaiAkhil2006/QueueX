/**
 * QueueX Firebase Integration Layer
 *
 * Architectural boundaries:
 * - Client components: import from "@/lib/firebase/client" (or "@/lib/firebase")
 * - Server Route Handlers / Server Actions: import from "@/lib/firebase/admin"
 *
 * This strict separation prevents service account credentials and admin SDKs
 * from ever being bundled into client code.
 */

export * from "./client";
export * from "./config";
