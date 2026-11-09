"use client";

import React, { useEffect, useState } from "react";
import type { SerializedDoctor, DoctorProfile } from "../types";
import { fetchDoctorProfile } from "../services/doctors.client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X,
  Stethoscope,
  Building2,
  DoorClosed,
  Clock,
  Phone,
  Mail,
  Calendar,
  Layers,
  Edit,
  AlertCircle,
  Activity,
} from "lucide-react";

interface DoctorProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: SerializedDoctor | null;
  hospitalId?: string;
  onEdit?: (doc: SerializedDoctor) => void;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function DoctorProfileDialog({
  isOpen,
  onClose,
  doctor,
  hospitalId = "hosp-vzg-001",
  onEdit,
}: DoctorProfileDialogProps) {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(doctor));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !doctor) {
      return;
    }

    let ignore = false;

    fetchDoctorProfile(hospitalId, doctor.id)
      .then((data) => {
        if (!ignore) {
          setProfile(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load doctor profile details"
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, doctor, hospitalId]);

  if (!isOpen || !doctor) return null;

  const currentDoctor = profile || doctor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-xl text-card-foreground">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {currentDoctor.name}
                </h3>
                <Badge
                  variant={
                    currentDoctor.availability === "available"
                      ? "default"
                      : currentDoctor.availability === "busy"
                      ? "destructive"
                      : "outline"
                  }
                  className="capitalize"
                >
                  {currentDoctor.availability.replace("_", " ")}
                </Badge>
                <Badge
                  variant={
                    currentDoctor.status === "active" ? "secondary" : "outline"
                  }
                  className="capitalize"
                >
                  {currentDoctor.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {currentDoctor.qualification} • {currentDoctor.specialization}
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

        <div className="mt-4 space-y-6">
          {/* Key Clinical & Room Metadata */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Building2 className="size-3.5" />
                Department
              </span>
              <p className="mt-1 text-xs font-semibold text-foreground">
                {currentDoctor.departmentName}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <DoorClosed className="size-3.5" />
                Room
              </span>
              <p className="mt-1 text-xs font-semibold text-foreground">
                {currentDoctor.roomNumber}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Clock className="size-3.5" />
                Est. Duration
              </span>
              <p className="mt-1 text-xs font-semibold text-foreground">
                {currentDoctor.consultationDurationEstimate} mins
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Activity className="size-3.5" />
                Consultations
              </span>
              <p className="mt-1 text-xs font-semibold text-foreground">
                {profile?.stats?.totalConsultations ?? "—"} Total
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-lg border bg-muted/10 p-3 text-xs space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-primary" />
                <span>{currentDoctor.phone || "No phone registered"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-primary" />
                <span>{currentDoctor.email || "No email registered"}</span>
              </div>
            </div>
          </div>

          {/* Weekly Schedule Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              Standard OPD Schedule
            </h4>

            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : profile?.schedule ? (
              <div className="rounded-lg border bg-card p-3 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Operating Hours:</span>
                    <span className="font-semibold text-foreground">
                      {profile.schedule.startTime} – {profile.schedule.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Max Patients / Session:</span>
                    <Badge variant="outline" className="font-mono">
                      {profile.schedule.maxPatientsPerSession}
                    </Badge>
                  </div>
                </div>

                {/* Working Days Badges */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-muted-foreground text-[11px]">
                    Working Days:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                      const isWorking = profile?.schedule?.workingDays?.includes(
                        dayIdx
                      );
                      return (
                        <span
                          key={dayIdx}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            isWorking
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted/40 text-muted-foreground/50"
                          }`}
                        >
                          {DAY_NAMES[dayIdx].slice(0, 3)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Breaks */}
                {profile.schedule.breakPeriods &&
                  profile.schedule.breakPeriods.length > 0 && (
                    <div className="text-[11px] text-muted-foreground pt-1">
                      <span>Scheduled Breaks: </span>
                      {profile.schedule.breakPeriods
                        .map(
                          (b) =>
                            `${b.label} (${b.startTime} - ${b.endTime})`
                        )
                        .join(", ")}
                    </div>
                  )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No recurring schedule defined for this doctor yet. (Configured in Doctor Schedules).
              </div>
            )}
          </div>

          {/* Upcoming OPD Sessions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              Active & Upcoming OPD Sessions
            </h4>

            {loading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : profile?.upcomingSessions && profile.upcomingSessions.length > 0 ? (
              <div className="rounded-lg border bg-card divide-y text-xs">
                {profile.upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">
                        {session.date}
                      </span>
                      <span className="font-semibold text-foreground">
                        {session.startTime} – {session.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Tokens: {session.completedCount}/{session.totalTokensIssued}
                      </span>
                      <Badge
                        variant={
                          session.status === "active" ? "default" : "secondary"
                        }
                        className="capitalize text-[10px]"
                      >
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No active or scheduled sessions for this doctor today.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <span className="text-[11px] font-mono text-muted-foreground">
            ID: {currentDoctor.id}
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(currentDoctor);
                }}
              >
                <Edit className="size-3.5" />
                Edit Profile
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
