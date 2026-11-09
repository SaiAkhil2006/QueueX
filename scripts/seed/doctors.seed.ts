import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Doctor } from "@/types/doctor";
import { SEED_HOSPITAL_ID } from "./hospital.seed";

export interface SeedDoctorDefinition {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  qualification: string;
  specialization: string;
  roomNumber: string;
  consultationDurationEstimate: number;
  phone: string;
  email: string;
}

export const SEED_DOCTORS_CONFIG: SeedDoctorDefinition[] = [
  // General Medicine
  {
    id: "doc-gm-01",
    departmentId: "dept-gm",
    departmentName: "General Medicine",
    name: "Dr. Rajesh Varma",
    qualification: "MBBS, MD (General Medicine)",
    specialization: "Internal Medicine & Metabolic Disorders",
    roomNumber: "101",
    consultationDurationEstimate: 10,
    phone: "+91 891 278 9101",
    email: "rajesh.varma@visakhahospital.org",
  },
  {
    id: "doc-gm-02",
    departmentId: "dept-gm",
    departmentName: "General Medicine",
    name: "Dr. Sunitha Rao",
    qualification: "MBBS, DNB (Family Medicine)",
    specialization: "Preventive Healthcare & Geriatrics",
    roomNumber: "102",
    consultationDurationEstimate: 14,
    phone: "+91 891 278 9102",
    email: "sunitha.rao@visakhahospital.org",
  },

  // Cardiology
  {
    id: "doc-cardio-01",
    departmentId: "dept-cardio",
    departmentName: "Cardiology",
    name: "Dr. K. S. Somasekhar",
    qualification: "MBBS, MD, DM (Cardiology)",
    specialization: "Interventional Cardiology & Ischemic Heart Disease",
    roomNumber: "201",
    consultationDurationEstimate: 22,
    phone: "+91 891 278 9201",
    email: "ks.somasekhar@visakhahospital.org",
  },
  {
    id: "doc-cardio-02",
    departmentId: "dept-cardio",
    departmentName: "Cardiology",
    name: "Dr. Ananya Patra",
    qualification: "MBBS, MD (General Medicine), DNB (Cardiology)",
    specialization: "Clinical Cardiology & Heart Failure",
    roomNumber: "202",
    consultationDurationEstimate: 16,
    phone: "+91 891 278 9202",
    email: "ananya.patra@visakhahospital.org",
  },

  // Orthopedics
  {
    id: "doc-ortho-01",
    departmentId: "dept-ortho",
    departmentName: "Orthopedics",
    name: "Dr. V. Murali Krishna",
    qualification: "MBBS, MS (Orthopaedics)",
    specialization: "Joint Replacement & Complex Trauma",
    roomNumber: "108",
    consultationDurationEstimate: 16,
    phone: "+91 891 278 9108",
    email: "murali.krishna@visakhahospital.org",
  },
  {
    id: "doc-ortho-02",
    departmentId: "dept-ortho",
    departmentName: "Orthopedics",
    name: "Dr. Harish Chandra",
    qualification: "MBBS, D.Ortho, DNB (Orthopaedics)",
    specialization: "Sports Medicine & Arthroscopy",
    roomNumber: "109",
    consultationDurationEstimate: 13,
    phone: "+91 891 278 9109",
    email: "harish.chandra@visakhahospital.org",
  },

  // Dermatology
  {
    id: "doc-derm-01",
    departmentId: "dept-derm",
    departmentName: "Dermatology",
    name: "Dr. Sneha Reddy",
    qualification: "MBBS, MD (Dermatology, Venereology & Leprosy)",
    specialization: "Clinical Dermatology & Trichology",
    roomNumber: "301",
    consultationDurationEstimate: 11,
    phone: "+91 891 278 9301",
    email: "sneha.reddy@visakhahospital.org",
  },
  {
    id: "doc-derm-02",
    departmentId: "dept-derm",
    departmentName: "Dermatology",
    name: "Dr. P. Venkat Ramana",
    qualification: "MBBS, DVD (Dermatology)",
    specialization: "Allergic Dermatoses & Pediatric Skin Disorders",
    roomNumber: "302",
    consultationDurationEstimate: 14,
    phone: "+91 891 278 9302",
    email: "venkat.ramana@visakhahospital.org",
  },

  // Pediatrics
  {
    id: "doc-pedia-01",
    departmentId: "dept-pedia",
    departmentName: "Pediatrics",
    name: "Dr. Lakshmi Prasanna",
    qualification: "MBBS, MD (Pediatrics)",
    specialization: "General Pediatrics & Neonatal Care",
    roomNumber: "205",
    consultationDurationEstimate: 14,
    phone: "+91 891 278 9205",
    email: "lakshmi.prasanna@visakhahospital.org",
  },
  {
    id: "doc-pedia-02",
    departmentId: "dept-pedia",
    departmentName: "Pediatrics",
    name: "Dr. G. Srinivasulu",
    qualification: "MBBS, DCH (Child Health), DNB (Pediatrics)",
    specialization: "Pediatric Infectious Diseases & Nutrition",
    roomNumber: "206",
    consultationDurationEstimate: 16,
    phone: "+91 891 278 9206",
    email: "g.srinivasulu@visakhahospital.org",
  },

  // ENT
  {
    id: "doc-ent-01",
    departmentId: "dept-ent",
    departmentName: "ENT",
    name: "Dr. Sai Prakash",
    qualification: "MBBS, MS (ENT)",
    specialization: "Rhinology, Endoscopic Sinus Surgery & Vertigo",
    roomNumber: "305",
    consultationDurationEstimate: 12,
    phone: "+91 891 278 9305",
    email: "sai.prakash@visakhahospital.org",
  },
  {
    id: "doc-ent-02",
    departmentId: "dept-ent",
    departmentName: "ENT",
    name: "Dr. Divya Bharathi",
    qualification: "MBBS, DLO (Otorhinolaryngology)",
    specialization: "General Otology & Voice Disorders",
    roomNumber: "306",
    consultationDurationEstimate: 13,
    phone: "+91 891 278 9306",
    email: "divya.bharathi@visakhahospital.org",
  },
];

export function generateSeedDoctors(
  hospitalId: string = SEED_HOSPITAL_ID,
  baseDate: Date = new Date()
): Doctor[] {
  const ts = toFirestoreTimestamp(baseDate);

  return SEED_DOCTORS_CONFIG.map((doc) => ({
    id: doc.id,
    hospitalId,
    departmentId: doc.departmentId,
    departmentName: doc.departmentName,
    name: doc.name,
    qualification: doc.qualification,
    specialization: doc.specialization,
    roomNumber: doc.roomNumber,
    consultationDurationEstimate: doc.consultationDurationEstimate,
    status: "active" as const,
    availability: "available" as const,
    phone: doc.phone,
    email: doc.email,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  }));
}
