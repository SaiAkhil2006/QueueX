"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QueueEntry, CompleteConsultationPayload, ConsultationOutcome } from "../types";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface CompleteConsultationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CompleteConsultationPayload) => Promise<void>;
  entry: QueueEntry | null;
}

export function CompleteConsultationDialog({
  isOpen,
  onClose,
  onSubmit,
  entry,
}: CompleteConsultationDialogProps) {
  if (!isOpen || !entry) return null;

  return (
    <CompleteConsultationInner
      key={entry.id}
      onClose={onClose}
      onSubmit={onSubmit}
      entry={entry}
    />
  );
}

function CompleteConsultationInner({
  onClose,
  onSubmit,
  entry,
}: Omit<CompleteConsultationDialogProps, "isOpen"> & { entry: QueueEntry }) {
  const [outcome, setOutcome] = useState<ConsultationOutcome>("routine_clear");
  const [notes, setNotes] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        outcome,
        notes: notes.trim() || undefined,
        delayReason: delayReason.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to complete consultation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl p-6 my-8 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Complete Consultation</h2>
              <p className="text-xs text-muted-foreground">
                Token {entry.tokenDisplay} — {entry.patientName} ({entry.patientAge} yrs, {entry.patientGender})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
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
            <Label htmlFor="consult-outcome">Consultation Clinical Outcome *</Label>
            <select
              id="consult-outcome"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as ConsultationOutcome)}
              required
            >
              <option value="routine_clear">Routine Clear / Discharge Advised</option>
              <option value="prescribed">Prescription Issued</option>
              <option value="follow_up_needed">Follow-up Consultation Needed</option>
              <option value="tests_ordered">Diagnostic Tests / Lab Investigation Ordered</option>
              <option value="referred">Specialist Referral Issued</option>
              <option value="admitted">Emergency Admission Recommended</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="consult-notes">Clinical Notes & Advice</Label>
            <Textarea
              id="consult-notes"
              placeholder="e.g. Advised rest, prescribed Paracetamol 650mg SOS, blood report normal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="delay-reason">Delay Reason (If consult took longer than normal)</Label>
            <Input
              id="delay-reason"
              placeholder="e.g. Detailed ECG review, complex multi-symptom history"
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {submitting ? "Completing..." : "Complete & Finalize"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
