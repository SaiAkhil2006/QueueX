"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Patient, CreatePatientInput, PatientGender, PatientStatus } from "../types";
import { X, User, Heart, AlertCircle } from "lucide-react";

interface PatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CreatePatientInput>) => Promise<void>;
  patient?: Patient | null;
  mode: "create" | "edit";
}

export function PatientDialog({
  isOpen,
  onClose,
  onSubmit,
  patient,
  mode,
}: PatientDialogProps) {
  if (!isOpen) return null;

  return (
    <PatientDialogInner
      key={patient?.id || "create-patient"}
      onClose={onClose}
      onSubmit={onSubmit}
      patient={patient}
      mode={mode}
    />
  );
}

function PatientDialogInner({
  onClose,
  onSubmit,
  patient,
  mode,
}: Omit<PatientDialogProps, "isOpen">) {
  const [name, setName] = useState(patient?.name || "");
  const [age, setAge] = useState<number>(patient?.age ?? 30);
  const [gender, setGender] = useState<PatientGender>(patient?.gender || "male");
  const [phone, setPhone] = useState(patient?.phone || "+91 ");
  const [email, setEmail] = useState(patient?.email || "");
  const [bloodGroup, setBloodGroup] = useState(patient?.bloodGroup || "O+");
  const [status, setStatus] = useState<PatientStatus>(patient?.status || "active");
  const [emergencyName, setEmergencyName] = useState(patient?.emergencyContact?.name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(patient?.emergencyContact?.phone || "");
  const [emergencyRelation, setEmergencyRelation] = useState(patient?.emergencyContact?.relation || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Patient full name is required.");
      return;
    }
    if (phone.trim().length < 8) {
      setError("Please provide a valid contact phone number.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: name.trim(),
        age: Number(age),
        gender,
        phone: phone.trim(),
        email: email.trim() ? email.trim() : null,
        bloodGroup: bloodGroup.trim() ? bloodGroup.trim() : null,
        status,
        emergencyContact: emergencyName.trim()
          ? {
              name: emergencyName.trim(),
              phone: emergencyPhone.trim() || phone.trim(),
              relation: emergencyRelation.trim() || "Relative",
            }
          : null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save patient record.");
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
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {mode === "create" ? "Register New Patient" : `Edit Patient — ${patient?.uhid}`}
              </h2>
              <p className="text-xs text-muted-foreground">
                Universal Health ID (UHID) and clinical intake records
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="patient-name">Patient Full Name *</Label>
              <Input
                id="patient-name"
                placeholder="e.g. K. Venkata Satyanarayana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="patient-age">Age (Years) *</Label>
              <Input
                id="patient-age"
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="patient-gender">Gender *</Label>
              <select
                id="patient-gender"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={gender}
                onChange={(e) => setGender(e.target.value as PatientGender)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="patient-phone">Primary Phone *</Label>
              <div className="relative">
                <Input
                  id="patient-phone"
                  placeholder="+91 98480 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="patient-blood">Blood Group</Label>
              <select
                id="patient-blood"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="patient-email">Email Address (Optional)</Label>
              <Input
                id="patient-email"
                type="email"
                placeholder="patient@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode === "edit" && (
              <div className="space-y-1">
                <Label htmlFor="patient-status">Status</Label>
                <select
                  id="patient-status"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PatientStatus)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              Emergency Contact (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="em-name" className="text-xs">Contact Name</Label>
                <Input
                  id="em-name"
                  placeholder="e.g. K. Lakshmi"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-rel" className="text-xs">Relation</Label>
                <Input
                  id="em-rel"
                  placeholder="e.g. Spouse / Son"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="em-phone" className="text-xs">Emergency Phone</Label>
                <Input
                  id="em-phone"
                  placeholder="+91 98481 12345"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
              {submitting ? "Saving..." : mode === "create" ? "Register Patient" : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
