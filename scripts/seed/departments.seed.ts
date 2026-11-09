import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Department } from "@/types/department";
import { SEED_HOSPITAL_ID } from "./hospital.seed";

export interface SeedDepartmentDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  floor: string;
  buildingWing: string;
  avgConsultationDurationMinutes: number;
}

export const SEED_DEPARTMENTS_CONFIG: SeedDepartmentDefinition[] = [
  {
    id: "dept-gm",
    name: "General Medicine",
    code: "GM",
    description: "Primary adult outpatient care, diagnostics, chronic illness management, and fever clinic.",
    floor: "Ground Floor",
    buildingWing: "A-Wing",
    avgConsultationDurationMinutes: 12,
  },
  {
    id: "dept-cardio",
    name: "Cardiology",
    code: "CARD",
    description: "Cardiovascular health, hypertension, ECG/Echocardiography evaluations, and heart failure follow-ups.",
    floor: "1st Floor",
    buildingWing: "B-Wing",
    avgConsultationDurationMinutes: 20,
  },
  {
    id: "dept-ortho",
    name: "Orthopedics",
    code: "ORTH",
    description: "Bone health, joint pain, fractures, spine care, and post-surgical rehabilitation.",
    floor: "Ground Floor",
    buildingWing: "B-Wing",
    avgConsultationDurationMinutes: 15,
  },
  {
    id: "dept-derm",
    name: "Dermatology",
    code: "DERM",
    description: "Skin conditions, allergies, dermatological procedures, and chronic dermatoses.",
    floor: "2nd Floor",
    buildingWing: "C-Wing",
    avgConsultationDurationMinutes: 12,
  },
  {
    id: "dept-pedia",
    name: "Pediatrics",
    code: "PED",
    description: "Comprehensive infant, child, and adolescent healthcare, growth monitoring, and immunization.",
    floor: "1st Floor",
    buildingWing: "A-Wing",
    avgConsultationDurationMinutes: 15,
  },
  {
    id: "dept-ent",
    name: "ENT",
    code: "ENT",
    description: "Ear, nose, and throat disorders, audiology screenings, sinus conditions, and voice clinic.",
    floor: "2nd Floor",
    buildingWing: "B-Wing",
    avgConsultationDurationMinutes: 12,
  },
];

export function generateSeedDepartments(
  hospitalId: string = SEED_HOSPITAL_ID,
  baseDate: Date = new Date()
): Department[] {
  const ts = toFirestoreTimestamp(baseDate);

  return SEED_DEPARTMENTS_CONFIG.map((dept) => ({
    id: dept.id,
    hospitalId,
    name: dept.name,
    code: dept.code,
    description: dept.description,
    floor: dept.floor,
    buildingWing: dept.buildingWing,
    avgConsultationDurationMinutes: dept.avgConsultationDurationMinutes,
    status: "active" as const,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  }));
}
