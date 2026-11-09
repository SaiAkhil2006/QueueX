"use client";

import React, { useState, useMemo } from "react";
import type { CreateSessionFormValues } from "../types";
import type { DepartmentWithStats } from "@/features/departments/types";
import type { SerializedDoctor } from "@/features/doctors/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  X,
  Calendar,
  Clock,
  Plus,
  Stethoscope,
  Building2,
  DoorClosed,
  AlertCircle,
} from "lucide-react";
import { getTodayDateString } from "../utils/session-dates";

interface SessionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSessionFormValues) => Promise<void>;
  departments: DepartmentWithStats[];
  doctors: SerializedDoctor[];
  isSubmitting: boolean;
}

export function SessionFormDialog({
  isOpen,
  onClose,
  onSubmit,
  departments,
  doctors,
  isSubmitting,
}: SessionFormDialogProps) {
  const activeDepartments = useMemo(
    () => departments.filter((d) => d.status === "active"),
    [departments]
  );

  const [departmentId, setDepartmentId] = useState<string>(
    () => activeDepartments[0]?.id || ""
  );
  const [doctorId, setDoctorId] = useState<string>(() => {
    const initialDept = activeDepartments[0]?.id || "";
    const deptDoctors = doctors.filter(
      (doc) => doc.departmentId === initialDept && doc.status === "active"
    );
    return deptDoctors[0]?.id || "";
  });
  const [roomNumber, setRoomNumber] = useState<string>(() => {
    const initialDept = activeDepartments[0]?.id || "";
    const deptDoctors = doctors.filter(
      (doc) => doc.departmentId === initialDept && doc.status === "active"
    );
    return deptDoctors[0]?.roomNumber || "";
  });
  const [date, setDate] = useState<string>(() => getTodayDateString());
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("13:00");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // When department changes, update doctor list and auto-select first doctor
  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    const deptDoctors = doctors.filter(
      (doc) => doc.departmentId === newDeptId && doc.status === "active"
    );
    const newDoc = deptDoctors[0];
    setDoctorId(newDoc?.id || "");
    setRoomNumber(newDoc?.roomNumber || "");
  };

  // When doctor changes, update room number
  const handleDoctorChange = (newDocId: string) => {
    setDoctorId(newDocId);
    const selected = doctors.find((d) => d.id === newDocId);
    if (selected?.roomNumber) {
      setRoomNumber(selected.roomNumber);
    }
  };

  if (!isOpen) return null;

  const filteredDoctors = doctors.filter(
    (doc) => doc.departmentId === departmentId && doc.status === "active"
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!departmentId) errs.departmentId = "Department is required";
    if (!doctorId) errs.doctorId = "Doctor is required";
    if (!roomNumber.trim()) errs.roomNumber = "Room number is required";
    if (!date) errs.date = "Session date is required";
    if (!startTime) errs.startTime = "Start time is required";
    if (!endTime) errs.endTime = "End time is required";

    if (startTime && endTime && startTime >= endTime) {
      errs.endTime = "End time must be after start time";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      await onSubmit({
        departmentId,
        doctorId,
        roomNumber: roomNumber.trim(),
        date,
        startTime,
        endTime,
      });
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create OPD session"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-xl text-card-foreground">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Plus className="size-5" />
            <h3 className="text-base font-semibold text-foreground">
              Create OPD Session
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {submitError && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Department Selection */}
          <div className="space-y-1">
            <Label htmlFor="session-dept" className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-muted-foreground" />
              <span>Department *</span>
            </Label>
            <select
              id="session-dept"
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {activeDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="text-xs text-destructive">{errors.departmentId}</p>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="space-y-1">
            <Label htmlFor="session-doctor" className="flex items-center gap-1.5">
              <Stethoscope className="size-3.5 text-muted-foreground" />
              <span>Assigned Doctor *</span>
            </Label>
            <select
              id="session-doctor"
              value={doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {filteredDoctors.length === 0 ? (
                <option value="">No active doctors in this department</option>
              ) : (
                filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — Room {doc.roomNumber} ({doc.specialization})
                  </option>
                ))
              )}
            </select>
            {errors.doctorId && (
              <p className="text-xs text-destructive">{errors.doctorId}</p>
            )}
          </div>

          {/* Room Number & Date */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="session-room" className="flex items-center gap-1.5">
                <DoorClosed className="size-3.5 text-muted-foreground" />
                <span>Room Number *</span>
              </Label>
              <Input
                id="session-room"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 101, 204"
              />
              {errors.roomNumber && (
                <p className="text-xs text-destructive">{errors.roomNumber}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="session-date" className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>Date *</span>
              </Label>
              <Input
                id="session-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="session-start" className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Scheduled Start *</span>
              </Label>
              <Input
                id="session-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              {errors.startTime && (
                <p className="text-xs text-destructive">{errors.startTime}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="session-end" className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Scheduled End *</span>
              </Label>
              <Input
                id="session-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              {errors.endTime && (
                <p className="text-xs text-destructive">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>Note:</strong> OPD sessions must comply with the doctor&apos;s weekly roster and will be created with status{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">Scheduled</span>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || filteredDoctors.length === 0}
            >
              {isSubmitting ? "Creating Session..." : "Create OPD Session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
