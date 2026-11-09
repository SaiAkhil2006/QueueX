import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { serializeTimestamps } from "@/lib/firebase/timestamps";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import {
  hospitalSchema,
  updateHospitalSchema,
} from "@/schemas/hospital.schema";
import type { Hospital } from "@/types/hospital";
import type { SerializedHospital } from "../types";
import { z } from "zod";

/**
 * Retrieves a hospital document by ID from Firestore.
 */
export async function getHospitalById(hospitalId: string): Promise<SerializedHospital | null> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.hospital(hospitalId));
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const rawData = snapshot.data();
  const parsed = hospitalSchema.parse({
    id: snapshot.id,
    ...rawData,
  });

  return serializeTimestamps(parsed) as SerializedHospital;
}

export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;

/**
 * Updates a hospital configuration document in Firestore.
 */
export async function updateHospitalById(
  hospitalId: string,
  input: UpdateHospitalInput
): Promise<SerializedHospital> {
  const validated = updateHospitalSchema.parse(input);
  const db = getAdminFirestore();
  const docRef = db.doc(paths.hospital(hospitalId));

  const existing = await docRef.get();
  if (!existing.exists) {
    throw new Error(`Hospital with ID "${hospitalId}" not found`);
  }

  const existingData = existing.data() as Partial<Hospital>;

  // Merge configuration deeply if provided
  const updatedConfiguration = {
    ...(existingData.configuration ?? {}),
    ...(validated.configuration ?? {}),
  };

  const updatePayload: Record<string, unknown> = {
    ...validated,
    configuration: updatedConfiguration,
    updatedAt: nowTimestamp(),
  };

  await docRef.set(updatePayload, { merge: true });

  const refreshed = await docRef.get();
  const finalHospital = hospitalSchema.parse({
    id: refreshed.id,
    ...refreshed.data(),
  });

  return serializeTimestamps(finalHospital) as SerializedHospital;
}
