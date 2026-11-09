import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Patient } from "@/types/patient";
import { SEED_HOSPITAL_ID } from "./hospital.seed";

interface SeedPatientRaw {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  emergencyName: string;
  emergencyRelation: string;
}

const RAW_PATIENTS: SeedPatientRaw[] = [
  // Pediatric (1-16)
  { name: "Master Sai Charan", age: 5, gender: "male", bloodGroup: "B+", emergencyName: "Venkata Rao", emergencyRelation: "Father" },
  { name: "Baby Ananya", age: 3, gender: "female", bloodGroup: "O+", emergencyName: "Sujatha M.", emergencyRelation: "Mother" },
  { name: "Master Tarun Teja", age: 8, gender: "male", bloodGroup: "A+", emergencyName: "Ramesh Babu", emergencyRelation: "Father" },
  { name: "Kumari Divya Sri", age: 11, gender: "female", bloodGroup: "AB+", emergencyName: "Madhavi L.", emergencyRelation: "Mother" },
  { name: "Master Rohan Varma", age: 14, gender: "male", bloodGroup: "O+", emergencyName: "Suresh Varma", emergencyRelation: "Father" },
  { name: "Kumari Harshitha", age: 9, gender: "female", bloodGroup: "B+", emergencyName: "Padma K.", emergencyRelation: "Mother" },
  { name: "Master Karthik", age: 6, gender: "male", bloodGroup: "A+", emergencyName: "Subba Rao", emergencyRelation: "Father" },
  { name: "Baby Snigdha", age: 2, gender: "female", bloodGroup: "O-", emergencyName: "Sireesha P.", emergencyRelation: "Mother" },

  // Young Adults (18-35)
  { name: "K. Venkata Satyanarayana", age: 28, gender: "male", bloodGroup: "O+", emergencyName: "K. Lakshmi", emergencyRelation: "Spouse" },
  { name: "P. Sneha Latha", age: 24, gender: "female", bloodGroup: "B+", emergencyName: "P. Appala Naidu", emergencyRelation: "Father" },
  { name: "M. Kalyan Chakravarthy", age: 31, gender: "male", bloodGroup: "A+", emergencyName: "M. Swapna", emergencyRelation: "Spouse" },
  { name: "G. Bhavani Devi", age: 29, gender: "female", bloodGroup: "O+", emergencyName: "G. Prasad", emergencyRelation: "Spouse" },
  { name: "V. Sai Teja", age: 22, gender: "male", bloodGroup: "B-", emergencyName: "V. Jagannadham", emergencyRelation: "Father" },
  { name: "T. Lavanya", age: 26, gender: "female", bloodGroup: "AB+", emergencyName: "T. Krishna Murthy", emergencyRelation: "Father" },
  { name: "B. Anand Mohan", age: 34, gender: "male", bloodGroup: "O+", emergencyName: "B. Deepa", emergencyRelation: "Spouse" },
  { name: "C. Sandhya Rani", age: 33, gender: "female", bloodGroup: "A+", emergencyName: "C. Srinivas", emergencyRelation: "Spouse" },
  { name: "S. Ravi Varma", age: 27, gender: "male", bloodGroup: "B+", emergencyName: "S. Anuradha", emergencyRelation: "Mother" },
  { name: "A. Kiran Kumar", age: 30, gender: "other", bloodGroup: "O+", emergencyName: "A. Parvathi", emergencyRelation: "Mother" },
  { name: "R. Geetha Madhuri", age: 25, gender: "female", bloodGroup: "AB-", emergencyName: "R. Mohan Rao", emergencyRelation: "Father" },
  { name: "K. Harish Chandra", age: 32, gender: "male", bloodGroup: "A-", emergencyName: "K. Shanti", emergencyRelation: "Spouse" },

  // Middle Aged (36-59)
  { name: "D. Rama Rao", age: 48, gender: "male", bloodGroup: "O+", emergencyName: "D. Padmavathi", emergencyRelation: "Spouse" },
  { name: "M. Vijayalakshmi", age: 42, gender: "female", bloodGroup: "B+", emergencyName: "M. Suresh Babu", emergencyRelation: "Spouse" },
  { name: "P. Prasad Raju", age: 53, gender: "male", bloodGroup: "A+", emergencyName: "P. Sailaja", emergencyRelation: "Spouse" },
  { name: "K. Hemalatha", age: 46, gender: "female", bloodGroup: "O+", emergencyName: "K. Mallikarjun", emergencyRelation: "Spouse" },
  { name: "V. Appala Naidu", age: 56, gender: "male", bloodGroup: "B+", emergencyName: "V. Aruna", emergencyRelation: "Spouse" },
  { name: "S. Anuradha Devi", age: 44, gender: "female", bloodGroup: "A+", emergencyName: "S. Balaji", emergencyRelation: "Spouse" },
  { name: "N. Srinivasa Rao", age: 51, gender: "male", bloodGroup: "O+", emergencyName: "N. Manjula", emergencyRelation: "Spouse" },
  { name: "Y. Radhika", age: 39, gender: "female", bloodGroup: "B+", emergencyName: "Y. Kishore", emergencyRelation: "Spouse" },
  { name: "L. Shiva Prasad", age: 47, gender: "male", bloodGroup: "AB+", emergencyName: "L. Kalyani", emergencyRelation: "Spouse" },
  { name: "J. Jhansi Rani", age: 54, gender: "female", bloodGroup: "O+", emergencyName: "J. Venkatesh", emergencyRelation: "Spouse" },
  { name: "T. Ramesh Chandra", age: 49, gender: "male", bloodGroup: "A+", emergencyName: "T. Saraswathi", emergencyRelation: "Spouse" },
  { name: "U. Sunitha Kumari", age: 41, gender: "female", bloodGroup: "B+", emergencyName: "U. Chandrasekhar", emergencyRelation: "Spouse" },
  { name: "G. Subrahmanyam", age: 57, gender: "male", bloodGroup: "O-", emergencyName: "G. Lakshmi Devi", emergencyRelation: "Spouse" },
  { name: "M. Madhavi", age: 38, gender: "female", bloodGroup: "A+", emergencyName: "M. Rajesh", emergencyRelation: "Spouse" },
  { name: "E. Durga Prasad", age: 45, gender: "male", bloodGroup: "B+", emergencyName: "E. Bhavani", emergencyRelation: "Spouse" },

  // Senior / Geriatric (60-84)
  { name: "V. Jagannadha Swamy", age: 67, gender: "male", bloodGroup: "O+", emergencyName: "V. Sai Teja", emergencyRelation: "Son" },
  { name: "K. Padmavathi Amma", age: 72, gender: "female", bloodGroup: "A+", emergencyName: "K. Venkata Ramana", emergencyRelation: "Son" },
  { name: "B. Chandrasekhar", age: 64, gender: "male", bloodGroup: "B+", emergencyName: "B. Anand Mohan", emergencyRelation: "Son" },
  { name: "M. Lakshmi Kantham", age: 70, gender: "female", bloodGroup: "O+", emergencyName: "M. Kalyan", emergencyRelation: "Son" },
  { name: "P. Mallikarjuna Rao", age: 78, gender: "male", bloodGroup: "AB+", emergencyName: "P. Prasad Raju", emergencyRelation: "Son" },
  { name: "S. Saraswathi Bai", age: 69, gender: "female", bloodGroup: "B+", emergencyName: "S. Ravi Varma", emergencyRelation: "Son" },
  { name: "A. Nageswara Rao", age: 75, gender: "male", bloodGroup: "O+", emergencyName: "A. Kiran Kumar", emergencyRelation: "Son" },
  { name: "T. Parvathamma", age: 82, gender: "female", bloodGroup: "A+", emergencyName: "T. Ramesh Chandra", emergencyRelation: "Son" },
  { name: "G. Venkateswarlu", age: 66, gender: "male", bloodGroup: "B+", emergencyName: "G. Srinivas", emergencyRelation: "Son" },
  { name: "D. Annapurna Devi", age: 73, gender: "female", bloodGroup: "O+", emergencyName: "D. Rama Rao", emergencyRelation: "Son" },
  { name: "R. Krishna Murthy", age: 71, gender: "male", bloodGroup: "A+", emergencyName: "R. Geetha", emergencyRelation: "Daughter" },
  { name: "K. Sitamma", age: 68, gender: "female", bloodGroup: "B+", emergencyName: "K. Harish", emergencyRelation: "Son" },
  { name: "M. Mohan Krishna", age: 63, gender: "male", bloodGroup: "O+", emergencyName: "M. Vijayalakshmi", emergencyRelation: "Spouse" },
  { name: "V. Subbalakshmi", age: 65, gender: "female", bloodGroup: "A+", emergencyName: "V. Appala Naidu", emergencyRelation: "Spouse" },
  { name: "N. Balaji Prasad", age: 62, gender: "male", bloodGroup: "B+", emergencyName: "N. Srinivasa Rao", emergencyRelation: "Brother" },
];

export function generateSeedPatients(
  hospitalId: string = SEED_HOSPITAL_ID,
  baseDate: Date = new Date()
): Patient[] {
  const ts = toFirestoreTimestamp(baseDate);

  return RAW_PATIENTS.map((raw, index) => {
    const seq = String(index + 1).padStart(4, "0");
    const id = `pat-${seq}`;
    const uhid = `QX-2026-${seq}`;
    const phone = `+91 98480 ${seq.padStart(5, "0")}`;
    const emailPrefix = raw.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const email = `${emailPrefix}.${seq}@example.org`;

    return {
      id,
      hospitalId,
      uhid,
      name: raw.name,
      age: raw.age,
      gender: raw.gender,
      phone,
      email,
      bloodGroup: raw.bloodGroup,
      status: "active" as const,
      emergencyContact: {
        name: raw.emergencyName,
        phone: `+91 98481 ${seq.padStart(5, "0")}`,
        relation: raw.emergencyRelation,
      },
      createdAt: ts,
      updatedAt: ts,
    };
  });
}
