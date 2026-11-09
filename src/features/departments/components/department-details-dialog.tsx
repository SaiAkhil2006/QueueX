"use client";

import React from "react";
import type { DepartmentWithStats } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  Clock,
  MapPin,
  Users,
  Calendar,
  Layers,
} from "lucide-react";
import { toDate } from "@/lib/firebase/timestamps";

interface DepartmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentWithStats | null;
  onEdit: (department: DepartmentWithStats) => void;
}

export function DepartmentDetailsDialog({
  isOpen,
  onClose,
  department,
  onEdit,
}: DepartmentDetailsDialogProps) {
  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl text-card-foreground">
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                {department.name}
              </h3>
              <Badge
                variant={
                  department.status === "active"
                    ? "default"
                    : department.status === "suspended"
                    ? "secondary"
                    : "outline"
                }
                className="capitalize"
              >
                {department.status}
              </Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              Code: {department.code} • ID: {department.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          {department.description && (
            <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border">
              {department.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-background">
              <MapPin className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">
                  {department.floor || "Unassigned"},{" "}
                  {department.buildingWing || "General"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-background">
              <Clock className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground">Consult Benchmark</p>
                <p className="font-medium text-foreground">
                  {department.avgConsultationDurationMinutes} mins / patient
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-background">
              <Users className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground">Assigned Doctors</p>
                <p className="font-medium text-foreground">
                  {department.doctorCount} doctors ({department.activeDoctorCount} active)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-background">
              <Calendar className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground">Established</p>
                <p className="font-medium text-foreground">
                  {toDate(department.createdAt)?.toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  }) || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-muted/10 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Layers className="size-3.5 text-primary" />
              <span>Operational Status</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {department.status === "active"
                ? "This department is fully operational. Doctors can conduct OPD sessions and patients can be scheduled for consultations."
                : "This department is currently marked inactive or suspended. New sessions cannot be initiated until reactivated."}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(department);
            }}
          >
            Edit Department
          </Button>
          <Button type="button" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
