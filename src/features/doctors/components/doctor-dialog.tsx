"use client";

import React, { useState } from "react";
import type { SerializedDoctor, DoctorFormValues } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Stethoscope, AlertCircle } from "lucide-react";
import type { DoctorStatus, DoctorAvailability } from "@/types/doctor";
import type { DepartmentWithStats } from "@/features/departments/types";

interface DoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: DoctorFormValues) => Promise<void>;
  doctor?: SerializedDoctor | null;
  departments: DepartmentWithStats[];
  isSubmitting: boolean;
}

export function DoctorDialog({
  isOpen,
  onClose,
  onSubmit,
  doctor,
  departments,
  isSubmitting,
}: DoctorDialogProps) {
  const isEditing = Boolean(doctor);

  const activeDepartments = departments.filter((d) => d.status === "active");

  const [formData, setFormData] = useState<DoctorFormValues>(() => {
    if (doctor) {
      return {
        name: doctor.name,
        departmentId: doctor.departmentId,
        qualification: doctor.qualification,
        specialization: doctor.specialization,
        roomNumber: doctor.roomNumber,
        consultationDurationEstimate: doctor.consultationDurationEstimate || 15,
        phone: doctor.phone || "",
        email: doctor.email || "",
        status: doctor.status,
        availability: doctor.availability,
      };
    }
    return {
      name: "",
      departmentId: activeDepartments[0]?.id || "",
      qualification: "",
      specialization: "",
      roomNumber: "",
      consultationDurationEstimate: 15,
      phone: "",
      email: "",
      status: "active",
      availability: "available",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Doctor name is required";
    if (!formData.departmentId) errs.departmentId = "Department is required";
    if (!formData.qualification.trim())
      errs.qualification = "Qualification is required";
    if (!formData.specialization.trim())
      errs.specialization = "Specialization is required";
    if (!formData.roomNumber.trim()) errs.roomNumber = "Room number is required";
    if (
      isNaN(formData.consultationDurationEstimate) ||
      formData.consultationDurationEstimate <= 0
    ) {
      errs.consultationDurationEstimate =
        "Consultation duration estimate must be positive";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Please enter a valid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save doctor record"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-xl text-card-foreground">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-primary">
            {isEditing ? (
              <Stethoscope className="size-5" />
            ) : (
              <UserPlus className="size-5" />
            )}
            <h3 className="text-base font-semibold text-foreground">
              {isEditing ? "Edit Doctor Profile" : "Register New Doctor"}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doc-name">Doctor Name *</Label>
              <Input
                id="doc-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={Boolean(errors.name)}
                placeholder="e.g. Dr. Sarah Jenkins"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-dept">Department *</Label>
              <select
                id="doc-dept"
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doc-qualification">Qualifications *</Label>
              <Input
                id="doc-qualification"
                value={formData.qualification}
                onChange={(e) =>
                  setFormData({ ...formData, qualification: e.target.value })
                }
                error={Boolean(errors.qualification)}
                placeholder="e.g. MBBS, MD (General Medicine)"
                disabled={isSubmitting}
              />
              {errors.qualification && (
                <p className="text-xs text-destructive">
                  {errors.qualification}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-specialization">Specialization *</Label>
              <Input
                id="doc-specialization"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
                error={Boolean(errors.specialization)}
                placeholder="e.g. Internal Medicine & Diabetology"
                disabled={isSubmitting}
              />
              {errors.specialization && (
                <p className="text-xs text-destructive">
                  {errors.specialization}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doc-room">Assigned Room *</Label>
              <Input
                id="doc-room"
                value={formData.roomNumber}
                onChange={(e) =>
                  setFormData({ ...formData, roomNumber: e.target.value })
                }
                error={Boolean(errors.roomNumber)}
                placeholder="e.g. Room 102"
                disabled={isSubmitting}
              />
              {errors.roomNumber && (
                <p className="text-xs text-destructive">{errors.roomNumber}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-duration">
                Avg Consult Duration (Mins) *
              </Label>
              <Input
                id="doc-duration"
                type="number"
                min={1}
                max={120}
                value={formData.consultationDurationEstimate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consultationDurationEstimate: parseInt(e.target.value, 10),
                  })
                }
                error={Boolean(errors.consultationDurationEstimate)}
                disabled={isSubmitting}
              />
              {errors.consultationDurationEstimate && (
                <p className="text-xs text-destructive">
                  {errors.consultationDurationEstimate}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doc-phone">Phone Number</Label>
              <Input
                id="doc-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="e.g. +91 98765 43210"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-email">Email Address</Label>
              <Input
                id="doc-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={Boolean(errors.email)}
                placeholder="e.g. doctor@hospital.org"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doc-status">Duty Status</Label>
              <select
                id="doc-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as DoctorStatus,
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              >
                <option value="active">Active (On Duty)</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-avail">Live Availability</Label>
              <select
                id="doc-avail"
                value={formData.availability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability: e.target.value as DoctorAvailability,
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              >
                <option value="available">Available</option>
                <option value="busy">Busy (In Session)</option>
                <option value="on_break">On Break</option>
                <option value="off_duty">Off Duty</option>
              </select>
            </div>
          </div>

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
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Profile"
                : "Register Doctor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
