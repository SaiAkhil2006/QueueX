"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Patient } from "@/types/patient";
import type { Doctor } from "@/types/doctor";
import type { Department } from "@/types/department";
import type { CreateAppointmentInput, AvailableSlot } from "../types";
import { fetchAvailableSlots } from "../services/appointments.client";
import { fetchPatients } from "@/features/patients/services/patients.client";
import { fetchDoctors } from "@/features/doctors/services/doctors.client";
import { fetchDepartments } from "@/features/departments/services/departments.client";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";

interface AppointmentBookingDialogProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: Partial<CreateAppointmentInput> & { isWalkIn?: boolean }) => Promise<void>;
  preselectedPatientId?: string | null;
}

export function AppointmentBookingDialog({
  hospitalId,
  isOpen,
  onClose,
  onSubmit,
  preselectedPatientId,
}: AppointmentBookingDialogProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [notes, setNotes] = useState("");

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patients, doctors, departments when opened
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function loadData() {
      try {
        const [pats, docs, depts] = await Promise.all([
          fetchPatients(hospitalId),
          fetchDoctors(hospitalId),
          fetchDepartments(hospitalId),
        ]);
        if (!active) return;
        setPatients(pats);
        const activeDocs = docs.filter((d) => d.isActive && d.status === "active");
        const activeDepts = depts.filter((d) => d.isActive && d.status === "active");
        setDoctors(activeDocs);
        setDepartments(activeDepts);

        if (preselectedPatientId) {
          setSelectedPatientId(preselectedPatientId);
        } else if (pats.length > 0) {
          setSelectedPatientId(pats[0].id);
        }

        if (activeDepts.length > 0) {
          setSelectedDeptId(activeDepts[0].id);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load clinic options");
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [isOpen, hospitalId, preselectedPatientId]);

  // Update filtered doctors when department changes
  const filteredDoctors = doctors.filter((d) => !selectedDeptId || d.departmentId === selectedDeptId);

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate || isWalkIn) {
      return;
    }

    let active = true;
    async function loadSlots() {
      try {
        setLoadingSlots(true);
        setError(null);
        const availableSlots = await fetchAvailableSlots(hospitalId, {
          doctorId: selectedDoctorId,
          date: selectedDate,
        });
        if (!active) return;
        setSlots(availableSlots);
        if (availableSlots.length > 0) {
          const firstAvail = availableSlots.find((s) => s.available);
          setSelectedTime(firstAvail ? firstAvail.time : "");
        } else {
          setSelectedTime("");
        }
      } catch (err: unknown) {
        if (active) {
          console.error(err);
          setSlots([]);
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      active = false;
    };
  }, [hospitalId, selectedDoctorId, selectedDate, isWalkIn]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPatientId) {
      setError("Please select a patient.");
      return;
    }
    if (!selectedDoctorId) {
      setError("Please select a doctor.");
      return;
    }
    if (!isWalkIn && !selectedTime) {
      setError("Please select an available appointment time slot.");
      return;
    }

    const patient = patients.find((p) => p.id === selectedPatientId);
    const doctor = doctors.find((d) => d.id === selectedDoctorId);
    const department = departments.find((d) => d.id === doctor?.departmentId);

    try {
      setSubmitting(true);
      await onSubmit({
        patientId: selectedPatientId,
        patientName: patient?.name,
        patientPhone: patient?.phone,
        doctorId: selectedDoctorId,
        doctorName: doctor?.name,
        departmentId: doctor?.departmentId,
        departmentName: department?.name,
        scheduledDate: selectedDate,
        scheduledTime: isWalkIn ? "09:00" : selectedTime,
        appointmentType: isWalkIn ? "walk_in" : "regular",
        isWalkIn,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-card border border-border shadow-2xl p-6 my-8 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isWalkIn ? "Direct Walk-in Intake" : "Book Doctor Appointment"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Deterministic slot allocation and conflict verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Walk-in Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
            <div>
              <span className="text-sm font-medium text-foreground block">Walk-in Patient Intake</span>
              <span className="text-xs text-muted-foreground">
                Immediate OPD intake today; sets status to Checked In directly
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsWalkIn(!isWalkIn)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isWalkIn ? "bg-teal-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isWalkIn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Patient Selection */}
          <div className="space-y-1">
            <Label htmlFor="booking-patient">Select Patient *</Label>
            <select
              id="booking-patient"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              <option value="" disabled>Select patient from registry...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.uhid}) — {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-1">
              <Label htmlFor="booking-dept">Department *</Label>
              <select
                id="booking-dept"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedDeptId}
                onChange={(e) => {
                  const newDeptId = e.target.value;
                  setSelectedDeptId(newDeptId);
                  const matching = doctors.filter((d) => d.departmentId === newDeptId);
                  if (matching.length > 0) {
                    setSelectedDoctorId(matching[0].id);
                  }
                }}
                required
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div className="space-y-1">
              <Label htmlFor="booking-doctor">Doctor *</Label>
              <select
                id="booking-doctor"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                required
              >
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.roomNumber ? `Rm ${doc.roomNumber}` : "OPD"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isWalkIn && (
            <>
              {/* Date */}
              <div className="space-y-1">
                <Label htmlFor="booking-date">Appointment Date *</Label>
                <Input
                  id="booking-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9"
                  required
                />
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Available Time Slots *</Label>
                  <span className="text-xs text-muted-foreground">
                    {loadingSlots ? "Checking doctor roster..." : `${slots.filter((s) => s.available).length} slots open`}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 animate-spin mr-2" />
                    Calculating available slots...
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                    No open consultation slots for this doctor on this day. The doctor may be off-duty or all slots may be booked.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 rounded-lg border border-border bg-muted/20">
                    {slots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-1.5 px-2 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-teal-600 text-white shadow-xs"
                              : slot.available
                              ? "bg-background hover:bg-muted border border-border text-foreground"
                              : "bg-muted/60 text-muted-foreground/50 border border-transparent cursor-not-allowed line-through"
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="booking-notes">Clinical Notes / Reason for Visit</Label>
            <Input
              id="booking-notes"
              placeholder="e.g. Follow-up consultation, chest discomfort, blood test review"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (!isWalkIn && !selectedTime)}
              className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
            >
              {submitting ? "Booking..." : isWalkIn ? "Check-in Walk-in" : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
