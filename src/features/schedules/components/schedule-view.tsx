"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { ScheduleWithDoctor, ScheduleFormValues } from "../types";
import {
  fetchSchedules,
  saveDoctorSchedule,
} from "../services/schedules.client";
import { fetchDepartments } from "@/features/departments/services/departments.client";
import type { DepartmentWithStats } from "@/features/departments/types";
import { ScheduleFormDialog } from "./schedule-form-dialog";
import { AvailabilityInspector } from "./availability-inspector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit,
  Filter,
  Users,
  Coffee,
} from "lucide-react";

interface ScheduleViewProps {
  hospitalId?: string;
}

const DAY_LABELS = [
  { val: 1, label: "M" },
  { val: 2, label: "T" },
  { val: 3, label: "W" },
  { val: 4, label: "T" },
  { val: 5, label: "F" },
  { val: 6, label: "S" },
  { val: 0, label: "S" },
];

export function ScheduleView({
  hospitalId = "hosp-vzg-001",
}: ScheduleViewProps) {
  const [schedules, setSchedules] = useState<ScheduleWithDoctor[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [todayIndex, setTodayIndex] = useState<number>(1);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleWithDoctor | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorDoctorId, setInspectorDoctorId] = useState<string | undefined>(
    undefined
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
        const [schData, deptsData] = await Promise.all([
          fetchSchedules(hospitalId),
          fetchDepartments(hospitalId),
        ]);
        if (!ignore) {
          setSchedules(schData);
          setDepartments(deptsData);
          setTodayIndex(new Date().getDay());
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load schedules"
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
    Promise.all([fetchSchedules(hospitalId), fetchDepartments(hospitalId)])
      .then(([schData, deptsData]) => {
        setSchedules(schData);
        setDepartments(deptsData);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load schedules"
        );
      })
      .finally(() => setLoading(false));
  }, [hospitalId]);

  // Submit Handler
  const handleScheduleSubmit = async (
    doctorId: string,
    values: ScheduleFormValues
  ) => {
    setIsSubmitting(true);
    try {
      const updated = await saveDoctorSchedule(hospitalId, doctorId, values);
      setSchedules((prev) =>
        prev.map((s) => (s.doctorId === doctorId ? updated : s))
      );
      setBannerMessage({
        type: "success",
        text: `Schedule for ${updated.doctorName} updated successfully.`,
      });
      setTimeout(() => setBannerMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === "" ||
        sch.doctorName.toLowerCase().includes(q) ||
        sch.departmentName.toLowerCase().includes(q) ||
        sch.roomNumber.toLowerCase().includes(q) ||
        sch.doctorSpecialization.toLowerCase().includes(q);

      const matchesDept =
        selectedDeptId === "all" || sch.departmentId === selectedDeptId;

      let matchesDay = true;
      if (selectedDay === "today") {
        matchesDay = sch.workingDays.includes(todayIndex);
      } else if (selectedDay !== "all") {
        matchesDay = sch.workingDays.includes(parseInt(selectedDay, 10));
      }

      return matchesSearch && matchesDept && matchesDay;
    });
  }, [schedules, searchQuery, selectedDeptId, selectedDay, todayIndex]);

  // Aggregates
  const workingTodayCount = useMemo(() => {
    return schedules.filter(
      (s) => s.isActive && s.workingDays.includes(todayIndex)
    ).length;
  }, [schedules, todayIndex]);

  const totalBreaks = useMemo(() => {
    return schedules.reduce(
      (acc, s) => acc + (s.breakPeriods?.length || 0),
      0
    );
  }, [schedules]);

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
          Unable to Load Schedules
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
            Doctor Schedules & Availability
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage OPD operating hours, working day rosters, scheduled breaks,
            session capacities, and test real-time availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setInspectorDoctorId(undefined);
              setIsInspectorOpen(true);
            }}
            variant="outline"
            size="sm"
          >
            <Clock className="size-4" />
            Inspect Availability
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Configured Schedules
              </p>
              <p className="text-2xl font-bold text-foreground">
                {schedules.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Working Today
              </p>
              <p className="text-2xl font-bold text-foreground">
                {workingTodayCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Active Rosters
              </p>
              <p className="text-2xl font-bold text-foreground">
                {schedules.filter((s) => s.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coffee className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Break Windows
              </p>
              <p className="text-2xl font-bold text-foreground">
                {totalBreaks}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search doctor, dept, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Roster Day:</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Days</option>
              <option value="today">Working Today</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="0">Sunday</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {filteredSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Calendar className="size-10 text-muted-foreground/40" />
            <h4 className="mt-3 text-sm font-semibold text-foreground">
              No schedules found
            </h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Try adjusting your search query or day filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Doctor & Clinical Unit</th>
                  <th className="px-4 py-3">Working Days</th>
                  <th className="px-4 py-3">Shift Hours</th>
                  <th className="px-4 py-3">Break Windows</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSchedules.map((sch) => (
                  <tr
                    key={sch.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {sch.doctorName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {sch.departmentName} • Room {sch.roomNumber}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {DAY_LABELS.map((d, i) => {
                          const isWorking = sch.workingDays.includes(d.val);
                          const isToday = d.val === todayIndex;
                          return (
                            <span
                              key={i}
                              title={`${
                                isWorking ? "Scheduled" : "Off"
                              } (Day ${d.val})`}
                              className={`flex size-5 items-center justify-center rounded text-[10px] font-bold ${
                                isWorking
                                  ? isToday
                                  : "bg-muted/40 text-muted-foreground/30"
                              } ${
                                isWorking && isToday
                                  ? "bg-primary text-primary-foreground ring-1 ring-primary"
                                  : isWorking
                                  ? "bg-primary/10 text-primary"
                                  : ""
                              }`}
                            >
                              {d.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono font-medium text-foreground">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {sch.startTime} – {sch.endTime}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {sch.breakPeriods && sch.breakPeriods.length > 0 ? (
                        <div className="space-y-0.5">
                          {sch.breakPeriods.map((bp, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground mr-1"
                            >
                              {bp.label}: {bp.startTime}–{bp.endTime}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          None
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-foreground">
                        {sch.maxPatientsPerSession} pts
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={sch.isActive ? "default" : "outline"}
                        className="capitalize"
                      >
                        {sch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Inspect Availability"
                          onClick={() => {
                            setInspectorDoctorId(sch.doctorId);
                            setIsInspectorOpen(true);
                          }}
                        >
                          <Clock className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="Edit Schedule"
                          onClick={() => {
                            setEditingSchedule(sch);
                            setIsFormOpen(true);
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
      <ScheduleFormDialog
        key={editingSchedule?.id ?? "new"}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={handleScheduleSubmit}
        schedule={editingSchedule}
        isSubmitting={isSubmitting}
      />

      {isInspectorOpen && (
        <AvailabilityInspector
          key={inspectorDoctorId ?? "general"}
          isOpen={isInspectorOpen}
          onClose={() => {
            setIsInspectorOpen(false);
            setInspectorDoctorId(undefined);
          }}
          schedules={schedules}
          initialDoctorId={inspectorDoctorId}
          hospitalId={hospitalId}
        />
      )}
    </div>
  );
}
