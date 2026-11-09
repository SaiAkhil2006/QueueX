"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from "../types";
import type { Doctor } from "@/types/doctor";
import type { Department } from "@/types/department";
import {
  fetchAppointments,
  createAppointmentClient,
  createWalkInClient,
  cancelAppointmentClient,
  rescheduleAppointmentClient,
  checkInAppointmentClient,
} from "../services/appointments.client";
import { fetchDoctors } from "@/features/doctors/services/doctors.client";
import { fetchDepartments } from "@/features/departments/services/departments.client";
import { AppointmentBookingDialog } from "./appointment-booking-dialog";
import { RescheduleDialog } from "./reschedule-dialog";
import {
  Calendar,
  Clock,
  UserCheck,
  RefreshCw,
  PlusCircle,
  XCircle,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

interface AppointmentViewProps {
  hospitalId: string;
}

export function AppointmentView({ hospitalId }: AppointmentViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Booking Modal
  const [bookingOpen, setBookingOpen] = useState(false);

  // Reschedule Modal
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [targetAppointment, setTargetAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    let active = true;
    async function loadFilters() {
      try {
        const [docs, depts] = await Promise.all([
          fetchDoctors(hospitalId),
          fetchDepartments(hospitalId),
        ]);
        if (active) {
          setDoctors(docs);
          setDepartments(depts);
        }
      } catch (err: unknown) {
        console.error(err);
      }
    }
    loadFilters();
    return () => {
      active = false;
    };
  }, [hospitalId]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAppointments(hospitalId, {
        date: selectedDate || undefined,
        departmentId: selectedDeptId !== "all" ? selectedDeptId : undefined,
        doctorId: selectedDoctorId !== "all" ? selectedDoctorId : undefined,
        status: statusFilter !== "all" ? (statusFilter as AppointmentStatus) : undefined,
      });
      setAppointments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [hospitalId, selectedDate, selectedDeptId, selectedDoctorId, statusFilter]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAppointments(hospitalId, {
          date: selectedDate || undefined,
          departmentId: selectedDeptId !== "all" ? selectedDeptId : undefined,
          doctorId: selectedDoctorId !== "all" ? selectedDoctorId : undefined,
          status: statusFilter !== "all" ? (statusFilter as AppointmentStatus) : undefined,
        });
        if (active) setAppointments(data);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load appointments");
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [hospitalId, selectedDate, selectedDeptId, selectedDoctorId, statusFilter]);

  const handleOpenBooking = () => {
    setBookingOpen(true);
  };

  const handleBookingSubmit = async (input: Partial<CreateAppointmentInput> & { isWalkIn?: boolean }) => {
    if (input.isWalkIn) {
      await createWalkInClient(hospitalId, {
        patientId: input.patientId!,
        doctorId: input.doctorId!,
        notes: input.notes || undefined,
      });
    } else {
      await createAppointmentClient(hospitalId, input as CreateAppointmentInput);
    }
    await loadAppointments();
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      setError(null);
      await checkInAppointmentClient(hospitalId, appointmentId);
      await loadAppointments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check in appointment");
    }
  };

  const handleCancel = async (apt: Appointment) => {
    const reason = window.prompt("Reason for cancellation (optional):", "Patient request / Rescheduling");
    if (reason === null) return;

    try {
      setError(null);
      await cancelAppointmentClient(hospitalId, apt.id, reason);
      await loadAppointments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment");
    }
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setTargetAppointment(apt);
    setRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (newDate: string, newTime: string) => {
    if (!targetAppointment) return;
    await rescheduleAppointmentClient(hospitalId, targetAppointment.id, newDate, newTime);
    await loadAppointments();
  };

  // Metrics
  const totalCount = appointments.length;
  const bookedCount = appointments.filter((a) => a.status === "booked").length;
  const checkedInCount = appointments.filter((a) => a.status === "checked_in").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled" || a.status === "no_show").length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Appointment Management & Intake
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Doctor consultation schedules, patient booking slots, walk-in check-in, and conflict resolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAppointments}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenBooking}
            className="h-9 gap-1.5 border-teal-500/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/10"
          >
            <UserPlus className="h-4 w-4" />
            Walk-in Intake
          </Button>
          <Button
            size="sm"
            onClick={handleOpenBooking}
            className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Booked Slots</div>
              <div className="text-2xl font-bold text-sky-600">{bookedCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Checked In (Ready)</div>
              <div className="text-2xl font-bold text-amber-600">{checkedInCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Completed</div>
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Cancelled / No-show</div>
              <div className="text-2xl font-bold text-rose-600">{cancelledCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-xs"
                    onClick={() => setSelectedDate("")}
                    title="Clear date filter (show all)"
                  >
                    All
                  </Button>
                )}
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Department</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Doctor</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="all">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses ({totalCount})</option>
                <option value="booked">Booked</option>
                <option value="checked_in">Checked In</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Appointments Table */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Time & Date</th>
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Doctor</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium">No appointments match the selected criteria.</p>
                    <p className="text-xs mt-1">Select a different date or schedule a new consultation.</p>
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        {apt.scheduledTime}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{apt.scheduledDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{apt.patientName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{apt.patientPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-medium">
                      {apt.departmentName}
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground font-medium">
                      {apt.doctorName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {apt.appointmentType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          apt.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : apt.status === "booked"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            : apt.status === "checked_in"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {apt.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === "booked" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckIn(apt.id)}
                              className="h-7 px-2 text-xs border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                              title="Check in patient upon arrival"
                            >
                              Check In
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReschedule(apt)}
                              className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400"
                              title="Reschedule appointment"
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(apt)}
                              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                              title="Cancel appointment"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {apt.status === "checked_in" && (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Checked In
                          </span>
                        )}
                        {apt.status === "completed" && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booking Dialog */}
      <AppointmentBookingDialog
        hospitalId={hospitalId}
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSubmit={handleBookingSubmit}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        hospitalId={hospitalId}
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onSubmit={handleRescheduleSubmit}
        appointment={targetAppointment}
      />
    </div>
  );
}
