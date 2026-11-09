import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { DoctorSchedule } from "@/types/scheduling";
import { SEED_HOSPITAL_ID } from "./hospital.seed";
import { SEED_DOCTORS_CONFIG } from "./doctors.seed";

export function generateSeedSchedules(
  hospitalId: string = SEED_HOSPITAL_ID,
  baseDate: Date = new Date()
): DoctorSchedule[] {
  const ts = toFirestoreTimestamp(baseDate);

  return SEED_DOCTORS_CONFIG.map((doc) => {
    // Tailor max capacity based on consultation pace
    const maxPatients =
      doc.departmentId === "dept-cardio"
        ? 30
        : doc.departmentId === "dept-gm"
        ? 45
        : 38;

    return {
      id: `sch-${doc.id}`,
      hospitalId,
      doctorId: doc.id,
      departmentId: doc.departmentId,
      workingDays: [1, 2, 3, 4, 5, 6], // Monday through Saturday
      startTime: "09:00",
      endTime: "17:00",
      maxPatientsPerSession: maxPatients,
      breakPeriods: [
        {
          startTime: "13:00",
          endTime: "14:00",
          label: "Lunch Break",
        },
      ],
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    };
  });
}
