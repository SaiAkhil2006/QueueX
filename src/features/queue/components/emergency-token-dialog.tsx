"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Patient } from "@/types/patient";
import { fetchPatients } from "@/features/patients/services/patients.client";
import { X, Siren, AlertCircle } from "lucide-react";

interface EmergencyTokenDialogProps {
  hospitalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patientId: string, notes?: string) => Promise<void>;
}

export function EmergencyTokenDialog({
  hospitalId,
  isOpen,
  onClose,
  onSubmit,
}: EmergencyTokenDialogProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function loadPatients() {
      try {
        const pats = await fetchPatients(hospitalId);
        if (active) {
          setPatients(pats);
          if (pats.length > 0) setSelectedPatientId(pats[0].id);
        }
      } catch (err: unknown) {
        if (active) console.error(err);
      }
    }

    loadPatients();
    return () => {
      active = false;
    };
  }, [hospitalId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError("Please select a patient.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(selectedPatientId, emergencyReason.trim() || "Critical Emergency Case");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to issue emergency token");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-card border border-rose-500/30 shadow-2xl p-6 my-8 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Siren className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Issue Immediate Emergency Token</h2>
              <p className="text-xs text-muted-foreground">
                Priority override: Automatically jumps to Position #1 ahead of waiting queue
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
            <Label htmlFor="em-patient">Select Patient *</Label>
            <select
              id="em-patient"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.uhid}) — {p.gender}, {p.age} yrs
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="em-reason">Emergency Clinical Reason *</Label>
            <Input
              id="em-reason"
              placeholder="e.g. Acute severe chest pain, acute respiratory distress, trauma"
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              required
            />
          </div>

          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
            <strong>Operational Notice:</strong> Emergency tokens trigger automatic audit logging and queue ETA recalculation.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {submitting ? "Issuing..." : "Issue Priority Token"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
