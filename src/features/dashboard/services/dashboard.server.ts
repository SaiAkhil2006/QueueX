import "server-only";

import { getHospitalById } from "@/features/hospital/services/hospital.server";
import { getDepartmentsByHospital } from "@/features/departments/services/departments.server";
import { getDoctorsByHospital } from "@/features/doctors/services/doctors.server";
import {
  getSessionsByHospital,
  getOperationalEvents,
} from "@/features/sessions/services/sessions.server";
import { getTodayDateString } from "@/features/sessions/utils/session-dates";
import type {
  DashboardData,
  DepartmentDashboardItem,
  DoctorAvailabilityItem,
  UpcomingSessionItem,
} from "../types";

/**
 * Aggregates complete staff operational dashboard telemetry directly from Firestore.
 */
export async function getStaffDashboardData(
  hospitalId: string
): Promise<DashboardData> {
  const todayStr = getTodayDateString();

  // Concurrent fetch of all primary domain records
  const [hospital, departments, doctors, sessions, recentEvents] =
    await Promise.all([
      getHospitalById(hospitalId),
      getDepartmentsByHospital(hospitalId),
      getDoctorsByHospital(hospitalId),
      getSessionsByHospital(hospitalId),
      getOperationalEvents(hospitalId, { limit: 10 }),
    ]);

  const activeDepartments = departments.filter((d) => d.status === "active");
  const activeDoctors = doctors.filter((doc) => doc.status === "active");

  // 1. Hospital Overview
  const todayDate = new Date();
  const currentDateFormatted = todayDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hospitalSummary = {
    hospitalId,
    hospitalName: hospital?.name || "Vizag Central Hospital",
    operatingStatus: hospital?.status || "active",
    activeDepartmentsCount: activeDepartments.length,
    totalDepartmentsCount: departments.length,
    activeDoctorsCount: activeDoctors.length,
    totalDoctorsCount: doctors.length,
    currentDateFormatted,
  };

  // 2. OPD Session Overview (Today)
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const sessionsSummary = {
    totalToday: todaySessions.length,
    active: todaySessions.filter((s) => s.status === "active").length,
    paused: todaySessions.filter((s) => s.status === "paused").length,
    scheduled: todaySessions.filter((s) => s.status === "scheduled").length,
    completed: todaySessions.filter((s) => s.status === "completed").length,
    cancelled: todaySessions.filter((s) => s.status === "cancelled").length,
  };

  // 3. Department Overview
  const departmentItems: DepartmentDashboardItem[] = departments.map((dept) => {
    const assignedDoctors = doctors.filter((doc) => doc.departmentId === dept.id);
    const deptActiveDocs = assignedDoctors.filter(
      (doc) => doc.status === "active"
    );
    const deptTodaySessions = todaySessions.filter(
      (s) => s.departmentId === dept.id
    );
    const activeSessionsCount = deptTodaySessions.filter(
      (s) => s.status === "active"
    ).length;
    const scheduledSessionsCount = deptTodaySessions.filter(
      (s) => s.status === "scheduled"
    ).length;

    let operationalStatus: "active" | "inactive" | "busy" | "normal" = "normal";
    if (dept.status !== "active") {
      operationalStatus = "inactive";
    } else if (activeSessionsCount > 0) {
      operationalStatus = "busy";
    } else {
      operationalStatus = "active";
    }

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      assignedDoctorsCount: assignedDoctors.length,
      activeDoctorsCount: deptActiveDocs.length,
      scheduledSessionsCount,
      activeSessionsCount,
      operationalStatus,
    };
  });

  // 4. Doctor Availability Overview
  const doctorItems: DoctorAvailabilityItem[] = doctors.map((doc) => {
    const activeSession = todaySessions.find(
      (s) =>
        s.doctorId === doc.id &&
        (s.status === "active" || s.status === "paused")
    );

    // Find next scheduled session chronologically
    const nextScheduled = sessions
      .filter(
        (s) =>
          s.doctorId === doc.id &&
          s.status === "scheduled" &&
          s.date >= todayStr
      )
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })[0];

    return {
      id: doc.id,
      name: doc.name,
      departmentId: doc.departmentId,
      departmentName: doc.departmentName,
      roomNumber: doc.roomNumber,
      availability: doc.availability,
      currentSessionStatus: activeSession ? activeSession.status : null,
      nextSession: nextScheduled
        ? {
            date: nextScheduled.date,
            startTime: nextScheduled.startTime,
            endTime: nextScheduled.endTime,
          }
        : null,
    };
  });

  // 5. Upcoming OPD Sessions (Chronological)
  const upcomingSessions: UpcomingSessionItem[] = sessions
    .filter(
      (s) =>
        (s.status === "scheduled" || s.status === "active") &&
        s.date >= todayStr
    )
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      doctorId: s.doctorId,
      doctorName: s.doctorName,
      departmentId: s.departmentId,
      departmentName: s.departmentName,
      roomNumber: s.roomNumber,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
    }));

  return {
    hospital: hospitalSummary,
    sessionsSummary,
    departments: departmentItems,
    doctors: doctorItems,
    upcomingSessions,
    recentEvents,
    lastUpdated: new Date().toISOString(),
  };
}
