"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Appointment, AvailableSlot } from "../types";
import { fetchAvailableSlots } from "../services/appointments.client";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";

interface RescheduleDialogProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newDate: string, newTime: string) => Promise<void>;
  appointment: Appointment | null;
}

export function RescheduleDialog({
  hospitalId,
  isOpen,
  onClose,
  onSubmit,
  appointment,
}: RescheduleDialogProps) {
  if (!isOpen || !appointment) return null;

  return (
    <RescheduleDialogInner
      key={appointment.id}
      hospitalId={hospitalId}
      onClose={onClose}
      onSubmit={onSubmit}
      appointment={appointment}
    />
  );
}

function RescheduleDialogInner({
  hospitalId,
  onClose,
  onSubmit,
  appointment,
}: Omit<RescheduleDialogProps, "isOpen"> & { appointment: Appointment }) {
  const [selectedDate, setSelectedDate] = useState(appointment.scheduledDate);
  const [selectedTime, setSelectedTime] = useState(appointment.scheduledTime);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSlots() {
      if (!selectedDate) return;
      try {
        setLoadingSlots(true);
        setError(null);
        const availableSlots = await fetchAvailableSlots(hospitalId, {
          doctorId: appointment.doctorId,
          date: selectedDate,
        });
        if (active) {
          setSlots(availableSlots);
        }
      } catch (err: unknown) {
        if (active) console.error(err);
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      active = false;
    };
  }, [hospitalId, appointment.doctorId, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      setError("Please select a time slot.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(selectedDate, selectedTime);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl p-6 my-8 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Reschedule Appointment</h2>
              <p className="text-xs text-muted-foreground">
                {appointment.patientName} with {appointment.doctorName}
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
          <div className="space-y-1">
            <Label htmlFor="resched-date">New Date *</Label>
            <Input
              id="resched-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Available Slots on {selectedDate}</Label>
              <span className="text-xs text-muted-foreground">
                {slots.filter((s) => s.available).length} slots open
              </span>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin mr-2" />
                Checking slots...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                No slots open for Dr. {appointment.doctorName} on this date.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 rounded-lg border border-border bg-muted/20">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available && slot.time !== appointment.scheduledTime}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-1.5 px-2 rounded text-xs font-mono font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : slot.available || slot.time === appointment.scheduledTime
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedTime}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? "Rescheduling..." : "Save New Slot"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
