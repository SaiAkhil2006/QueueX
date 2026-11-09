"use client";

import React, { useState } from "react";
import type { ScheduleWithDoctor, ScheduleFormValues } from "../types";
import type { ScheduleBreak } from "@/types/scheduling";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Coffee,
} from "lucide-react";
import { validateScheduleTiming } from "../utils/availability";

interface ScheduleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (doctorId: string, values: ScheduleFormValues) => Promise<void>;
  schedule: ScheduleWithDoctor | null;
  isSubmitting: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
  { value: 0, label: "Sun", full: "Sunday" },
];

export function ScheduleFormDialog({
  isOpen,
  onClose,
  onSubmit,
  schedule,
  isSubmitting,
}: ScheduleFormDialogProps) {
  const [workingDays, setWorkingDays] = useState<number[]>(
    () => schedule?.workingDays || [1, 2, 3, 4, 5, 6]
  );
  const [startTime, setStartTime] = useState<string>(
    () => schedule?.startTime || "09:00"
  );
  const [endTime, setEndTime] = useState<string>(
    () => schedule?.endTime || "17:00"
  );
  const [maxPatients, setMaxPatients] = useState<number>(
    () => schedule?.maxPatientsPerSession || 40
  );
  const [breakPeriods, setBreakPeriods] = useState<ScheduleBreak[]>(
    () =>
      schedule?.breakPeriods || [
        { label: "Lunch Break", startTime: "13:00", endTime: "14:00" },
      ]
  );
  const [isActive, setIsActive] = useState<boolean>(
    () => schedule?.isActive ?? true
  );

  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !schedule) return null;

  const toggleDay = (dayValue: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort((a, b) => a - b)
    );
  };

  const handleAddBreak = () => {
    setBreakPeriods((prev) => [
      ...prev,
      { label: "Rest Break", startTime: "16:00", endTime: "16:30" },
    ]);
  };

  const handleRemoveBreak = (index: number) => {
    setBreakPeriods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBreakChange = (
    index: number,
    field: keyof ScheduleBreak,
    val: string
  ) => {
    setBreakPeriods((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: val } : b))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (workingDays.length === 0) {
      setError("Please select at least one operating working day.");
      return;
    }

    try {
      validateScheduleTiming(startTime, endTime, breakPeriods);
    } catch (valErr: unknown) {
      setError(
        valErr instanceof Error ? valErr.message : "Invalid timing configuration"
      );
      return;
    }

    try {
      await onSubmit(schedule.doctorId, {
        workingDays,
        startTime,
        endTime,
        maxPatientsPerSession: Number(maxPatients),
        breakPeriods,
        isActive,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to save schedule"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-xl text-card-foreground">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="size-5" />
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Configure OPD Schedule
              </h3>
              <p className="text-xs text-muted-foreground">
                {schedule.doctorName} • {schedule.departmentName} ({schedule.roomNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Operating Working Days */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Weekly Working Days *
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const selected = workingDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {day.full}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="shift-start" className="text-xs">
                Shift Start Time (HH:MM) *
              </Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="shift-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="shift-end" className="text-xs">
                Shift End Time (HH:MM) *
              </Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="shift-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Max Patients & Status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="max-capacity" className="text-xs">
                Max Patient Capacity / Session *
              </Label>
              <Input
                id="max-capacity"
                type="number"
                min={1}
                max={200}
                value={maxPatients}
                onChange={(e) => setMaxPatients(parseInt(e.target.value, 10))}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sch-active" className="text-xs">
                Schedule Status
              </Label>
              <select
                id="sch-active"
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Active Schedule</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          {/* Break Periods */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <Coffee className="size-4 text-primary" />
                Scheduled Break Periods
              </Label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleAddBreak}
              >
                <Plus className="size-3" />
                Add Break
              </Button>
            </div>

            {breakPeriods.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No scheduled breaks defined. Continuous consultation shift.
              </p>
            ) : (
              <div className="space-y-2">
                {breakPeriods.map((bp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border bg-muted/20 p-2 text-xs"
                  >
                    <Input
                      placeholder="Break Label (e.g. Lunch)"
                      value={bp.label}
                      onChange={(e) =>
                        handleBreakChange(idx, "label", e.target.value)
                      }
                      className="h-8 text-xs flex-1"
                      required
                    />
                    <Input
                      type="time"
                      value={bp.startTime}
                      onChange={(e) =>
                        handleBreakChange(idx, "startTime", e.target.value)
                      }
                      className="h-8 w-24 text-xs"
                      required
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      value={bp.endTime}
                      onChange={(e) =>
                        handleBreakChange(idx, "endTime", e.target.value)
                      }
                      className="h-8 w-24 text-xs"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveBreak(idx)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
