"use client";

import React, { useState } from "react";
import type { DepartmentWithStats, DepartmentFormValues } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Building2, AlertCircle } from "lucide-react";
import type { DepartmentStatus } from "@/types/department";

interface DepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => Promise<void>;
  department?: DepartmentWithStats | null;
  isSubmitting: boolean;
}

export function DepartmentDialog({
  isOpen,
  onClose,
  onSubmit,
  department,
  isSubmitting,
}: DepartmentDialogProps) {
  const isEditing = Boolean(department);

  const [formData, setFormData] = useState<DepartmentFormValues>(() => {
    if (department) {
      return {
        name: department.name,
        code: department.code,
        description: department.description || "",
        floor: department.floor || "",
        buildingWing: department.buildingWing || "",
        avgConsultationDurationMinutes:
          department.avgConsultationDurationMinutes || 15,
        status: department.status,
      };
    }
    return {
      name: "",
      code: "",
      description: "",
      floor: "Ground Floor",
      buildingWing: "A-Wing",
      avgConsultationDurationMinutes: 15,
      status: "active",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Department name is required";
    if (!formData.code.trim() || formData.code.length < 2)
      errs.code = "Code must be at least 2 characters";
    if (
      isNaN(formData.avgConsultationDurationMinutes) ||
      formData.avgConsultationDurationMinutes <= 0
    ) {
      errs.avgConsultationDurationMinutes =
        "Duration must be a positive number of minutes";
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
        err instanceof Error ? err.message : "Failed to save department"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl text-card-foreground">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="size-5" />
            <h3 className="text-base font-semibold text-foreground">
              {isEditing ? "Edit Department" : "Add Clinical Department"}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="dept-name">Department Name *</Label>
              <Input
                id="dept-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={Boolean(errors.name)}
                placeholder="e.g. Cardiology"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="dept-code">Code *</Label>
              <Input
                id="dept-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                error={Boolean(errors.code)}
                placeholder="e.g. CARD"
                maxLength={8}
                disabled={isSubmitting}
              />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="dept-desc">Description</Label>
            <Textarea
              id="dept-desc"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Clinical focus, specialized facilities, and patient care scope..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="dept-floor">Floor Location</Label>
              <Input
                id="dept-floor"
                value={formData.floor}
                onChange={(e) =>
                  setFormData({ ...formData, floor: e.target.value })
                }
                placeholder="e.g. 1st Floor"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dept-wing">Building Wing</Label>
              <Input
                id="dept-wing"
                value={formData.buildingWing}
                onChange={(e) =>
                  setFormData({ ...formData, buildingWing: e.target.value })
                }
                placeholder="e.g. B-Wing"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="dept-duration">Avg Consultation (Minutes) *</Label>
              <Input
                id="dept-duration"
                type="number"
                min={1}
                max={120}
                value={formData.avgConsultationDurationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    avgConsultationDurationMinutes: parseInt(e.target.value, 10),
                  })
                }
                error={Boolean(errors.avgConsultationDurationMinutes)}
                disabled={isSubmitting}
              />
              {errors.avgConsultationDurationMinutes && (
                <p className="text-xs text-destructive">
                  {errors.avgConsultationDurationMinutes}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="dept-status">Status</Label>
              <select
                id="dept-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as DepartmentStatus,
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
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
                ? "Update Department"
                : "Create Department"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
