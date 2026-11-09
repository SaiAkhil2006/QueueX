"use client";

import React, { useState } from "react";
import type { ScheduleWithDoctor, AvailabilityResult } from "../types";
import { queryDoctorAvailability } from "../services/schedules.client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  CalendarOff,
} from "lucide-react";

interface AvailabilityInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ScheduleWithDoctor[];
  initialDoctorId?: string;
  hospitalId?: string;
}

export function AvailabilityInspector({
  isOpen,
  onClose,
  schedules,
  initialDoctorId,
  hospitalId = "hosp-vzg-001",
}: AvailabilityInspectorProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    () => initialDoctorId || schedules[0]?.doctorId || ""
  );

  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    return `${currentHours}:${currentMinutes}`;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError("Please select a doctor");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await queryDoctorAvailability(
        hospitalId,
        selectedDoctorId,
        date,
        time
      );
      setResult(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to calculate availability"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl text-card-foreground">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="size-5" />
            <h3 className="text-base font-semibold text-foreground">
              Doctor Availability Inspector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleInspect} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="insp-doc" className="text-xs">
              Select Doctor *
            </Label>
            <select
              id="insp-doc"
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                setResult(null);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {schedules.map((s) => (
                <option key={s.doctorId} value={s.doctorId}>
                  {s.doctorName} — {s.departmentName} ({s.roomNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="insp-date" className="text-xs">
                Target Date *
              </Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="insp-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setResult(null);
                  }}
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="insp-time" className="text-xs">
                Target Time (HH:MM) *
              </Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="insp-time"
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setResult(null);
                  }}
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                const now = new Date();
                setDate(now.toISOString().split("T")[0]);
                const currentHours = String(now.getHours()).padStart(2, "0");
                const currentMinutes = String(now.getMinutes()).padStart(2, "0");
                setTime(`${currentHours}:${currentMinutes}`);
                setResult(null);
              }}
            >
              Reset to Current Time
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Checking..." : "Inspect Availability"}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Evaluation for {result.dayName}, {result.targetDate} at{" "}
                {result.targetTime}
              </span>
              <Badge
                variant={
                  result.isAvailable
                    ? "default"
                    : result.status === "on_break"
                    ? "secondary"
                    : "outline"
                }
                className="capitalize"
              >
                {result.status.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-background p-3 text-xs">
              {result.isAvailable ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : result.status === "on_break" ? (
                <Coffee className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : result.status === "not_working_day" ? (
                <CalendarOff className="size-5 shrink-0 text-muted-foreground" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-destructive" />
              )}
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{result.reason}</p>
                {result.shiftHours && (
                  <p className="text-[11px] text-muted-foreground">
                    Operating Hours: {result.shiftHours.startTime} –{" "}
                    {result.shiftHours.endTime}
                  </p>
                )}
                {result.nextAvailableTime && (
                  <p className="text-[11px] font-medium text-primary">
                    Next Consultation Slot Available at: {result.nextAvailableTime}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
