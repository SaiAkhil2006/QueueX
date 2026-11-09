import { paths } from "@/lib/firebase/collections";
import { generateSeedDataset, validateSeedDataset } from "./generator";
import { getSeedFirestore } from "./admin";
import { SEED_HOSPITAL_ID } from "./hospital.seed";
import type { Firestore, WriteBatch } from "firebase-admin/firestore";

function parseArgs(): { clear: boolean; dryRun: boolean; help: boolean } {
  const args = process.argv.slice(2);
  return {
    clear: args.includes("--clear"),
    dryRun: args.includes("--dry-run"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

function printHelp(): void {
  console.log(`
QueueX Synthetic Hospital Seed Tool
====================================
Usage:
  npm run seed             Generate, validate, and write synthetic data to Firestore
  npm run seed:clear       Delete synthetic hospital (hosp-vzg-001) and its subcollections
  npx tsx scripts/seed/index.ts --dry-run   Validate generation without database writes
  npx tsx scripts/seed/index.ts --help      Show this help message
`);
}

/**
 * Helper to write documents in batches with a maximum size of 400 per commit.
 */
class BatchCommitter {
  private db: Firestore;
  private currentBatch: WriteBatch;
  private opCount = 0;
  private totalCommitted = 0;
  private readonly MAX_BATCH_SIZE = 400;

  constructor(db: Firestore) {
    this.db = db;
    this.currentBatch = db.batch();
  }

  async set(docRef: FirebaseFirestore.DocumentReference, data: FirebaseFirestore.DocumentData): Promise<void> {
    this.currentBatch.set(docRef, data, { merge: true });
    this.opCount++;

    if (this.opCount >= this.MAX_BATCH_SIZE) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.opCount > 0) {
      await this.currentBatch.commit();
      this.totalCommitted += this.opCount;
      this.opCount = 0;
      this.currentBatch = this.db.batch();
    }
  }

  getTotal(): number {
    return this.totalCommitted + this.opCount;
  }
}

async function clearHospitalData(db: Firestore, hospitalId: string): Promise<number> {
  console.log(`[QueueX Seed] Clearing synthetic hospital [${hospitalId}] data...`);
  let deletedCount = 0;

  const subcollectionNames = [
    "departments",
    "doctors",
    "schedules",
    "sessions",
    "patients",
    "appointments",
    "consultations",
    "queueEntries",
    "operationalEvents",
    "predictions",
    "recommendations",
  ];

  const hospitalDocRef = db.doc(paths.hospital(hospitalId));

  for (const subName of subcollectionNames) {
    const subRef = hospitalDocRef.collection(subName);
    const snapshot = await subRef.get();
    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      deletedCount += snapshot.size;
      console.log(`  - Deleted ${snapshot.size} docs from ${subName}`);
    }
  }

  // Delete the hospital doc itself
  await hospitalDocRef.delete();
  deletedCount++;
  console.log(`  - Deleted hospital document [${hospitalId}]`);

  return deletedCount;
}

async function main(): Promise<void> {
  const { clear, dryRun, help } = parseArgs();

  if (help) {
    printHelp();
    process.exit(0);
  }

  console.log("==================================================");
  console.log("QueueX Synthetic Hospital Seed Tool");
  console.log("==================================================");

  // 1. Generate and validate the dataset
  console.log("[QueueX Seed] Generating synthetic hospital dataset (Asia/Kolkata)...");
  const dataset = generateSeedDataset();
  const report = validateSeedDataset(dataset);

  if (!report.valid) {
    console.error("[QueueX Seed] Validation failed with errors:");
    report.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log("[QueueX Seed] In-memory generation & Zod schema validation successful!");
  console.log("--------------------------------------------------");
  console.log(`Hospital:              1 (${dataset.hospital.name} [${dataset.hospital.id}])`);
  console.log(`Departments:           ${report.counts.departments}`);
  console.log(`Doctors:               ${report.counts.doctors}`);
  console.log(`Doctor Schedules:      ${report.counts.schedules}`);
  console.log(`OPD Sessions:          ${report.counts.sessions}`);
  console.log(`Patients:              ${report.counts.patients}`);
  console.log(`Appointments:          ${report.counts.appointments}`);
  console.log(`Historical Consults:   ${report.counts.consultations}`);
  console.log(`Total Entities:        ${report.totalEntities}`);
  console.log("--------------------------------------------------");

  if (dryRun) {
    console.log("[QueueX Seed] Dry-run complete. No database writes were performed.");
    process.exit(0);
  }

  // 2. Connect to Firestore
  const { db, projectId, reason } = getSeedFirestore();

  if (clear) {
    if (!db) {
      console.warn("\n[QueueX Seed: Clear] Firestore credentials not configured.");
      console.warn(`Reason: ${reason}`);
      console.warn(`Target for deletion: Hospital [${SEED_HOSPITAL_ID}] and its subcollections.`);
      console.warn("To perform live database deletion, configure credentials in .env.local.");
      process.exit(0);
    }

    try {
      const deleted = await clearHospitalData(db, SEED_HOSPITAL_ID);
      console.log(`\n[QueueX Seed] Clear completed successfully. Deleted ${deleted} documents.`);
      process.exit(0);
    } catch (err) {
      console.error("[QueueX Seed] Error during clear:", err);
      process.exit(1);
    }
  }

  // 3. Write to Firestore if connected
  if (!db) {
    console.log("\n[Notice] Firebase Admin credentials are not configured in environment.");
    console.log(`Details: ${reason}`);
    console.log("\nDataset generation and validation completed 100% successfully in offline mode.");
    console.log("When credentials are provided in .env.local (or emulator is active), running");
    console.log("'npm run seed' will persist this verified dataset to Firestore.\n");
    process.exit(0);
  }

  console.log(`[QueueX Seed] Connected to Firestore (Project: ${projectId}). Writing documents...`);
  const committer = new BatchCommitter(db);

  try {
    const hId = dataset.hospital.id;

    // Hospital
    await committer.set(db.doc(paths.hospital(hId)), dataset.hospital);

    // Departments
    for (const dept of dataset.departments) {
      await committer.set(db.doc(paths.department(hId, dept.id)), dept);
    }

    // Doctors
    for (const doc of dataset.doctors) {
      await committer.set(db.doc(paths.doctor(hId, doc.id)), doc);
    }

    // Schedules
    for (const sch of dataset.schedules) {
      await committer.set(db.doc(paths.schedule(hId, sch.id)), sch);
    }

    // Sessions
    for (const ses of dataset.sessions) {
      await committer.set(db.doc(paths.session(hId, ses.id)), ses);
    }

    // Patients
    for (const pat of dataset.patients) {
      await committer.set(db.doc(paths.patient(hId, pat.id)), pat);
    }

    // Appointments
    for (const apt of dataset.appointments) {
      await committer.set(db.doc(paths.appointment(hId, apt.id)), apt);
    }

    // Consultations
    for (const cns of dataset.consultations) {
      await committer.set(db.doc(paths.consultation(hId, cns.id)), cns);
    }

    await committer.flush();
    console.log(`[QueueX Seed] Success! Committed ${committer.getTotal()} records to Firestore.`);
  } catch (err) {
    console.error("[QueueX Seed] Error writing to Firestore:", err);
    process.exit(1);
  }
}

// Execute when invoked directly
main().catch((err) => {
  console.error("[QueueX Seed] Fatal error:", err);
  process.exit(1);
});
