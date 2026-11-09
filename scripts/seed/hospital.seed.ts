import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Hospital } from "@/types/hospital";

export const SEED_HOSPITAL_ID = "hosp-vzg-001";

export function generateSeedHospital(baseDate: Date = new Date()): Hospital {
  const ts = toFirestoreTimestamp(baseDate);

  return {
    id: SEED_HOSPITAL_ID,
    name: "Visakha Multispeciality Hospital",
    code: "VMH",
    description:
      "Premier tertiary referral hospital providing compassionate outpatient diagnostics, specialized clinical care, and multi-disciplinary medical consultations in Visakhapatnam.",
    address: "Plot 42, Health City, Chinagadili",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    postalCode: "530040",
    timezone: "Asia/Kolkata",
    phone: "+91 891 278 9000",
    email: "info@visakhahospital.org",
    status: "active",
    isActive: true,
    configuration: {
      opdMorningStartTime: "08:30",
      opdMorningEndTime: "13:30",
      opdEveningStartTime: "16:00",
      opdEveningEndTime: "20:00",
      emergencyWaitThresholdMinutes: 10,
      maxActiveQueuesPerDoctor: 1,
      autoCallNextEnabled: false,
      operatingDays: [1, 2, 3, 4, 5, 6],
    },
    createdAt: ts,
    updatedAt: ts,
  };
}
