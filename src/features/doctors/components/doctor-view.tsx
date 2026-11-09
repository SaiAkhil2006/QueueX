"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { SerializedDoctor, DoctorFormValues } from "../types";
import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  setDoctorAvailability,
} from "../services/doctors.client";
import { fetchDepartments } from "@/features/departments/services/departments.client";
import type { DepartmentWithStats } from "@/features/departments/types";
import { DoctorDialog } from "./doctor-dialog";
import { DoctorProfileDialog } from "./doctor-profile-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Stethoscope,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit,
  Eye,
  Filter,
  UserCheck,
  Clock,
  DoorClosed,
} from "lucide-react";
import type { DoctorStatus, DoctorAvailability } from "@/types/doctor";

interface DoctorViewProps {
  hospitalId?: string;
}

export function DoctorView({ hospitalId = "hosp-vzg-001" }: DoctorViewProps) {
  const [doctors, setDoctors] = useState<SerializedDoctor[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | DoctorAvailability
  >("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DoctorStatus>("all");

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<SerializedDoctor | null>(
    null
  );
  const [profileDoctor, setProfileDoctor] = useState<SerializedDoctor | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User feedback
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [docsData, deptsData] = await Promise.all([
          fetchDoctors(hospitalId),
          fetchDepartments(hospitalId),
        ]);
        if (!ignore) {
          setDoctors(docsData);
          setDepartments(deptsData);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load doctor directory"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [hospitalId]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchDoctors(hospitalId),
      fetchDepartments(hospitalId),
    ])
      .then(([docsData, deptsData]) => {
        setDoctors(docsData);
        setDepartments(deptsData);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load doctor directory"
        );
      })
      .finally(() => setLoading(false));
  }, [hospitalId]);

  // Submit Handler for Doctor Create/Edit
  const handleDialogSubmit = async (values: DoctorFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingDoctor) {
        const updated = await updateDoctor(
          hospitalId,
          editingDoctor.id,
          values
        );
        setDoctors((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
        setBannerMessage({
          type: "success",
          text: `Doctor "${updated.name}" updated successfully.`,
        });
      } else {
        const created = await createDoctor(hospitalId, values);
        setDoctors((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setBannerMessage({
          type: "success",
          text: `Doctor "${created.name}" registered successfully.`,
        });
      }
      setTimeout(() => setBannerMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Availability Change
  const handleQuickAvailabilityChange = async (
    doctor: SerializedDoctor,
    newAvailability: DoctorAvailability
  ) => {
    try {
      const updated = await setDoctorAvailability(
        hospitalId,
        doctor.id,
        newAvailability
      );
      setDoctors((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      setBannerMessage({
        type: "success",
        text: `${doctor.name}'s status changed to ${newAvailability.replace(
          "_",
          " "
        )}.`,
      });
      setTimeout(() => setBannerMessage(null), 3000);
    } catch (err: unknown) {
      setBannerMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to update doctor availability",
      });
    }
  };

  // Filtered List
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === "" ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        doc.departmentName.toLowerCase().includes(q) ||
        doc.roomNumber.toLowerCase().includes(q) ||
        doc.qualification.toLowerCase().includes(q);

      const matchesDept =
        selectedDeptId === "all" || doc.departmentId === selectedDeptId;

      const matchesAvailability =
        availabilityFilter === "all" || doc.availability === availabilityFilter;

      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;

      return (
        matchesSearch && matchesDept && matchesAvailability && matchesStatus
      );
    });
  }, [doctors, searchQuery, selectedDeptId, availabilityFilter, statusFilter]);

  // Aggregate stats
  const availableCount = useMemo(
    () => doctors.filter((d) => d.availability === "available").length,
    [doctors]
  );

  const busyCount = useMemo(
    () => doctors.filter((d) => d.availability === "busy").length,
    [doctors]
  );

  const onDutyCount = useMemo(
    () => doctors.filter((d) => d.status === "active").length,
    [doctors]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          Unable to Load Doctors
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="size-4" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Feedback */}
      {bannerMessage && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 text-sm ${
            bannerMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {bannerMessage.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <AlertCircle className="size-5 shrink-0" />
          )}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Medical Staff & Doctors
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage doctor profiles, clinical assignments, room mappings,
            consultation duration pacing, and live availability.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingDoctor(null);
            setIsDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="size-4" />
          Register Doctor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Doctors
              </p>
              <p className="text-2xl font-bold text-foreground">
                {doctors.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Available Now
              </p>
              <p className="text-2xl font-bold text-foreground">
                {availableCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Busy / In Session
              </p>
              <p className="text-2xl font-bold text-foreground">{busyCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                On Duty Roster
              </p>
              <p className="text-2xl font-bold text-foreground">
                {onDutyCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search doctor, dept, room, specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span>Dept:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Availability:</span>
            <select
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(
                  e.target.value as "all" | DoctorAvailability
                )
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="on_break">On Break</option>
              <option value="off_duty">Off Duty</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | DoctorStatus)
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Directory Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Stethoscope className="size-10 text-muted-foreground/40" />
            <h4 className="mt-3 text-sm font-semibold text-foreground">
              No doctors found
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {searchQuery ||
              selectedDeptId !== "all" ||
              availabilityFilter !== "all" ||
              statusFilter !== "all"
                ? "Try adjusting your search criteria or active filters."
                : "Get started by registering a medical practitioner."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Department & Room</th>
                  <th className="px-4 py-3">Consult Pace</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3">Duty Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDoctors.map((doc) => (
                  <tr
                    key={doc.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                          {doc.name.replace(/^Dr\.\s*/i, "").charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {doc.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {doc.qualification} • {doc.specialization}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {doc.departmentName}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <DoorClosed className="size-3" />
                        {doc.roomNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {doc.consultationDurationEstimate} min / patient
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={doc.availability}
                        onChange={(e) =>
                          handleQuickAvailabilityChange(
                            doc,
                            e.target.value as DoctorAvailability
                          )
                        }
                        className={`h-7 rounded-md border px-2 text-[11px] font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 ${
                          doc.availability === "available"
                            ? "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : doc.availability === "busy"
                            ? "border-amber-500/40 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : doc.availability === "on_break"
                            ? "border-blue-500/40 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                            : "border-border bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="on_break">On Break</option>
                        <option value="off_duty">Off Duty</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          doc.status === "active"
                            ? "default"
                            : doc.status === "on_leave"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {doc.status.replace("_", " ")}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="View Doctor Profile"
                          onClick={() => setProfileDoctor(doc)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Edit Profile"
                          onClick={() => {
                            setEditingDoctor(doc);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DoctorDialog
        key={editingDoctor?.id ?? "new"}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingDoctor(null);
        }}
        onSubmit={handleDialogSubmit}
        doctor={editingDoctor}
        departments={departments}
        isSubmitting={isSubmitting}
      />

      <DoctorProfileDialog
        key={profileDoctor?.id ?? "closed"}
        isOpen={Boolean(profileDoctor)}
        onClose={() => setProfileDoctor(null)}
        doctor={profileDoctor}
        hospitalId={hospitalId}
        onEdit={(doc) => {
          setEditingDoctor(doc);
          setIsDialogOpen(true);
        }}
      />
    </div>
  );
}
