import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Appointment, AppointmentStatus, AppointmentType } from "@/types/appointment";
import type { Patient } from "@/types/patient";
import type { Doctor } from "@/types/doctor";
import { SEED_HOSPITAL_ID } from "./hospital.seed";
import {
  getKolkataDateString,
  createKolkataTimestamp,
} from "./dates";

interface AppointmentPlan {
  offsetDays: number;
  time: string;
  doctorIdx: number;
  patientIdx: number;
  status: AppointmentStatus;
  type: AppointmentType;
  tokenNumber: number | null;
  notes: string;
}

export function generateSeedAppointments(
  patients: Patient[],
  doctors: Doctor[],
  hospitalId: string = SEED_HOSPITAL_ID,
  baseDate: Date = new Date()
): Appointment[] {
  const ts = toFirestoreTimestamp(baseDate);

  // Distribution plan:
  // - 20 appointments in the past: 16 completed, 3 no_show, 1 cancelled
  // - 25 appointments today: 10 completed, 8 checked_in, 5 booked, 2 cancelled
  // - 15 appointments upcoming: 15 booked
  // Total: 60 appointments
  const plans: AppointmentPlan[] = [];

  // Slot times across morning and afternoon
  const morningTimes = [
    "09:15", "09:30", "09:45", "10:00", "10:15", "10:30",
    "10:45", "11:00", "11:15", "11:30", "11:45", "12:00",
  ];
  const afternoonTimes = [
    "14:15", "14:30", "14:45", "15:00", "15:15", "15:30",
  ];

  let pIdx = 0;
  const nextPatient = () => {
    const idx = pIdx % patients.length;
    pIdx++;
    return idx;
  };

  // --- PAST DAYS: Day -2 (10 apts) ---
  for (let i = 0; i < 10; i++) {
    const docIdx = i % doctors.length;
    const isNoShow = i === 8;
    const isCancelled = i === 9;
    const status: AppointmentStatus = isNoShow
      ? "no_show"
      : isCancelled
      ? "cancelled"
      : "completed";

    plans.push({
      offsetDays: -2,
      time: morningTimes[i % morningTimes.length],
      doctorIdx: docIdx,
      patientIdx: nextPatient(),
      status,
      type: i % 4 === 0 ? "follow_up" : i === 7 ? "referral" : "regular",
      tokenNumber: status === "completed" ? i + 1 : null,
      notes:
        status === "completed"
          ? "Historical OPD consultation completed"
          : status === "no_show"
          ? "Patient did not attend appointment"
          : "Appointment cancelled by patient prior to consultation",
    });
  }

  // --- PAST DAYS: Day -1 (10 apts) ---
  for (let i = 0; i < 10; i++) {
    const docIdx = (i + 2) % doctors.length;
    const isNoShow = i === 7 || i === 9;
    const status: AppointmentStatus = isNoShow ? "no_show" : "completed";

    plans.push({
      offsetDays: -1,
      time: morningTimes[i % morningTimes.length],
      doctorIdx: docIdx,
      patientIdx: nextPatient(),
      status,
      type: i % 3 === 0 ? "follow_up" : "regular",
      tokenNumber: status === "completed" ? i + 1 : null,
      notes:
        status === "completed"
          ? "Historical OPD consultation completed"
          : "Patient did not attend appointment",
    });
  }

  // --- TODAY: Day 0 (25 apts) ---
  for (let i = 0; i < 25; i++) {
    const docIdx = i % doctors.length;
    let status: AppointmentStatus = "booked";
    let token: number | null = null;
    let time = morningTimes[i % morningTimes.length];
    let note = "Today's OPD slot";

    if (i < 10) {
      status = "completed";
      token = i + 1;
      note = "Consultation concluded";
    } else if (i < 18) {
      status = "checked_in";
      token = i + 1;
      note = "Patient checked in and waiting in OPD lounge";
    } else if (i < 23) {
      status = "booked";
      time = afternoonTimes[(i - 18) % afternoonTimes.length];
      token = null;
      note = "Confirmed afternoon OPD slot";
    } else {
      status = "cancelled";
      token = null;
      note = "Appointment cancelled / rescheduled";
    }

    plans.push({
      offsetDays: 0,
      time,
      doctorIdx: docIdx,
      patientIdx: nextPatient(),
      status,
      type: i % 5 === 0 ? "follow_up" : i === 12 ? "referral" : "regular",
      tokenNumber: token,
      notes: note,
    });
  }

  // --- FUTURE: Day +1 (10 apts) & Day +2 (5 apts) ---
  for (let i = 0; i < 10; i++) {
    const docIdx = (i + 4) % doctors.length;
    plans.push({
      offsetDays: 1,
      time: morningTimes[i % morningTimes.length],
      doctorIdx: docIdx,
      patientIdx: nextPatient(),
      status: "booked",
      type: i % 3 === 0 ? "follow_up" : "regular",
      tokenNumber: null,
      notes: "Advance OPD booking",
    });
  }

  for (let i = 0; i < 5; i++) {
    const docIdx = (i + 6) % doctors.length;
    plans.push({
      offsetDays: 2,
      time: morningTimes[i % morningTimes.length],
      doctorIdx: docIdx,
      patientIdx: nextPatient(),
      status: "booked",
      type: i === 2 ? "referral" : "regular",
      tokenNumber: null,
      notes: "Advance OPD booking",
    });
  }

  return plans.map((plan, index) => {
    const seq = String(index + 1).padStart(3, "0");
    const id = `apt-${seq}`;
    const dateStr = getKolkataDateString(plan.offsetDays, baseDate);
    const scheduledAt = createKolkataTimestamp(dateStr, plan.time);

    const doc = doctors[plan.doctorIdx];
    const pat = patients[plan.patientIdx];

    return {
      id,
      hospitalId,
      patientId: pat.id,
      patientName: pat.name,
      patientPhone: pat.phone,
      doctorId: doc.id,
      doctorName: doc.name,
      departmentId: doc.departmentId,
      departmentName: doc.departmentName,
      scheduledDate: dateStr,
      scheduledTime: plan.time,
      scheduledAt,
      appointmentType: plan.type,
      status: plan.status,
      tokenNumber: plan.tokenNumber,
      queueEntryId:
        plan.status === "completed" || plan.status === "checked_in"
          ? `qe-${id}`
          : null,
      notes: plan.notes,
      createdAt: ts,
      updatedAt: ts,
    };
  });
}
