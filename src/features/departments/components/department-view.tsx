"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { DepartmentWithStats, DepartmentFormValues } from "../types";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  setDepartmentStatus,
} from "../services/departments.client";
import { DepartmentDialog } from "./department-dialog";
import { DepartmentDetailsDialog } from "./department-details-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Plus,
  Search,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Edit,
  Eye,
  Filter,
} from "lucide-react";
import type { DepartmentStatus } from "@/types/department";

interface DepartmentViewProps {
  hospitalId?: string;
}

export function DepartmentView({
  hospitalId = "hosp-vzg-001",
}: DepartmentViewProps) {
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DepartmentStatus>(
    "all"
  );

  // Modal dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentWithStats | null>(null);
  const [detailsDepartment, setDetailsDepartment] =
    useState<DepartmentWithStats | null>(null);
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
        const data = await fetchDepartments(hospitalId);
        if (!ignore) {
          setDepartments(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load clinical departments"
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
    fetchDepartments(hospitalId)
      .then((data) => setDepartments(data))
      .catch((err: unknown) =>
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load clinical departments"
        )
      )
      .finally(() => setLoading(false));
  }, [hospitalId]);

  // Handle Create or Edit
  const handleDialogSubmit = async (values: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingDepartment) {
        const updated = await updateDepartment(
          hospitalId,
          editingDepartment.id,
          values
        );
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
        setBannerMessage({
          type: "success",
          text: `Department "${updated.name}" updated successfully.`,
        });
      } else {
        const created = await createDepartment(hospitalId, values);
        setDepartments((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setBannerMessage({
          type: "success",
          text: `Department "${created.name}" created successfully.`,
        });
      }
      setTimeout(() => setBannerMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle (Active / Inactive)
  const handleToggleStatus = async (dept: DepartmentWithStats) => {
    const nextStatus: DepartmentStatus =
      dept.status === "active" ? "inactive" : "active";
    try {
      const updated = await setDepartmentStatus(
        hospitalId,
        dept.id,
        nextStatus
      );
      setDepartments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      setBannerMessage({
        type: "success",
        text: `Department "${dept.name}" marked as ${nextStatus}.`,
      });
      setTimeout(() => setBannerMessage(null), 4000);
    } catch (err: unknown) {
      setBannerMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to update department status",
      });
    }
  };

  // Filtered List
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesSearch =
        searchQuery === "" ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dept.description &&
          dept.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || dept.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchQuery, statusFilter]);

  // Aggregate stats
  const totalDoctors = useMemo(() => {
    return departments.reduce((acc, d) => acc + d.doctorCount, 0);
  }, [departments]);

  const activeClinics = useMemo(() => {
    return departments.filter((d) => d.status === "active").length;
  }, [departments]);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          Unable to Load Departments
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
            Clinical Departments
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage outpatient clinical units, room locations, consultation pace baselines, and doctor assignments.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingDepartment(null);
            setIsDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="size-4" />
          Add Department
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Departments
              </p>
              <p className="text-2xl font-bold text-foreground">
                {departments.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Active Clinics
              </p>
              <p className="text-2xl font-bold text-foreground">
                {activeClinics}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Assigned Doctors
              </p>
              <p className="text-2xl font-bold text-foreground">{totalDoctors}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            Status:
          </span>
          <div className="flex rounded-lg border bg-muted/20 p-0.5 text-xs">
            {(["all", "active", "inactive"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                  statusFilter === status
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Department Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {filteredDepartments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="size-10 text-muted-foreground/40" />
            <h4 className="mt-3 text-sm font-semibold text-foreground">
              No clinical departments found
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search criteria or status filter."
                : "Get started by registering a new clinical outpatient department."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Assigned Doctors</th>
                  <th className="px-4 py-3">Consult Benchmark</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDepartments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 font-mono text-[11px] font-bold text-primary">
                          {dept.code}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {dept.name}
                          </p>
                          <p className="line-clamp-1 max-w-xs text-[11px] text-muted-foreground">
                            {dept.description || "Outpatient clinic unit"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-foreground">
                        {dept.floor || "Unassigned"}
                      </span>
                      {dept.buildingWing && (
                        <span className="block text-[11px] text-muted-foreground">
                          {dept.buildingWing}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <Users className="size-3.5 text-muted-foreground" />
                        {dept.doctorCount}{" "}
                        <span className="text-muted-foreground text-[11px]">
                          ({dept.activeDoctorCount} active)
                        </span>
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {dept.avgConsultationDurationMinutes} min
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          dept.status === "active"
                            ? "default"
                            : dept.status === "suspended"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {dept.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="View Details"
                          onClick={() => setDetailsDepartment(dept)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Edit Department"
                          onClick={() => {
                            setEditingDepartment(dept);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title={
                            dept.status === "active"
                              ? "Deactivate Department"
                              : "Activate Department"
                          }
                          onClick={() => handleToggleStatus(dept)}
                          className={
                            dept.status === "active"
                              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          }
                        >
                          <Power className="size-3.5" />
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

      {/* Dialogs */}
      <DepartmentDialog
        key={editingDepartment?.id ?? "new"}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingDepartment(null);
        }}
        onSubmit={handleDialogSubmit}
        department={editingDepartment}
        isSubmitting={isSubmitting}
      />

      <DepartmentDetailsDialog
        isOpen={Boolean(detailsDepartment)}
        onClose={() => setDetailsDepartment(null)}
        department={detailsDepartment}
        onEdit={(dept) => {
          setEditingDepartment(dept);
          setIsDialogOpen(true);
        }}
      />
    </div>
  );
}
