"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PatientWithHistory } from "../types";
import {
  X,
  Phone,
  Mail,
  Calendar,
  Heart,
} from "lucide-react";

interface PatientProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithHistory | null;
  onBookAppointment?: (patient: PatientWithHistory) => void;
}

export function PatientProfileDialog({
  isOpen,
  onClose,
  patient,
  onBookAppointment,
}: PatientProfileDialogProps) {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl p-6 my-8 animate-in fade-in-0 zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
                <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                  {patient.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                  {patient.uhid}
                </span>
                <span className="text-xs text-muted-foreground">
                  {patient.gender} • {patient.age} yrs • Blood Group: {patient.bloodGroup || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 py-4 space-y-6">
          {/* Contact Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Primary Contact
              </span>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                Emergency Contact
              </span>
              {patient.emergencyContact ? (
                <>
                  <div className="text-sm font-medium text-foreground">
                    {patient.emergencyContact.name} ({patient.emergencyContact.relation})
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{patient.emergencyContact.phone}</span>
                  </div>
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No emergency contact registered.
                </span>
              )}
            </div>
          </div>

          {/* Visits & Consultations Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
              <span className="text-xs text-muted-foreground block">Total OPD Visits</span>
              <span className="text-xl font-bold text-primary">{patient.totalVisits}</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
              <span className="text-xs text-muted-foreground block">Completed Consults</span>
              <span className="text-xl font-bold text-emerald-600">
                {patient.consultations?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-center">
              <span className="text-xs text-muted-foreground block">Scheduled / Booked</span>
              <span className="text-xl font-bold text-indigo-600">
                {patient.appointments?.filter((a) => a.status === "booked").length || 0}
              </span>
            </div>
          </div>

          {/* Appointment History */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              Appointment History ({patient.appointments?.length || 0})
            </h3>
            {patient.appointments && patient.appointments.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2 px-3 font-medium">Date & Time</th>
                      <th className="py-2 px-3 font-medium">Department</th>
                      <th className="py-2 px-3 font-medium">Doctor</th>
                      <th className="py-2 px-3 font-medium">Type</th>
                      <th className="py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {patient.appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium text-foreground">
                          {apt.scheduledDate} {apt.scheduledTime}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{apt.departmentName}</td>
                        <td className="py-2 px-3 text-foreground">{apt.doctorName}</td>
                        <td className="py-2 px-3">
                          <span className="capitalize">{apt.appointmentType}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              apt.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : apt.status === "booked"
                                ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                                : apt.status === "checked_in"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic p-3 rounded-lg bg-muted/20 border border-border">
                No past appointments found for this patient.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Registered: {typeof patient.createdAt === "string" ? new Date(patient.createdAt).toLocaleDateString() : (patient.createdAt as unknown as { toDate?: () => Date })?.toDate?.()?.toLocaleDateString() ?? "Active"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onBookAppointment && (
              <Button
                onClick={() => {
                  onClose();
                  onBookAppointment(patient);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                Book Appointment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
