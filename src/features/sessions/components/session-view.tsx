"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import type {
  SerializedOPDSession,
  SessionTransitionAction,
  CreateSessionFormValues,
} from "../types";
import {
  fetchSessions,
  createOPDSession,
  transitionOPDSession,
} from "../services/sessions.client";
import { fetchDepartments } from "@/features/departments/services/departments.client";
import { fetchDoctors } from "@/features/doctors/services/doctors.client";
import type { DepartmentWithStats } from "@/features/departments/types";
import type { SerializedDoctor } from "@/features/doctors/types";
import { SessionFormDialog } from "./session-form-dialog";
import { SessionDetailsDialog } from "./session-details-dialog";
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
  Plus,
  Play,
  Pause,
  Eye,
  Activity,
} from "lucide-react";
import { getTodayDateString } from "../utils/session-dates";

interface SessionViewProps {
  hospitalId?: string;
}

export function SessionView({
  hospitalId = "hosp-vzg-001",
}: SessionViewProps) {
  const [sessions, setSessions] = useState<SerializedOPDSession[]>([]);
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [doctors, setDoctors] = useState<SerializedDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [timeframeView, setTimeframeView] = useState<
    "all" | "today" | "upcoming" | "past"
  >("today");
  const [todayStr, setTodayStr] = useState<string>("");

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<SerializedOPDSession | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Banner Feedback
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [sessionsData, deptsData, docsData] = await Promise.all([
        fetchSessions(hospitalId),
        fetchDepartments(hospitalId),
        fetchDoctors(hospitalId),
      ]);
      setSessions(sessionsData);
      setDepartments(deptsData);
      setDoctors(docsData);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load OPD sessions"
      );
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [sessionsData, deptsData, docsData] = await Promise.all([
          fetchSessions(hospitalId),
          fetchDepartments(hospitalId),
          fetchDoctors(hospitalId),
        ]);
        if (!ignore) {
          setSessions(sessionsData);
          setDepartments(deptsData);
          setDoctors(docsData);
          setTodayStr(getTodayDateString());
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load OPD sessions"
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

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    loadData();
  };

  // Create Session Handler
  const handleCreateSession = async (values: CreateSessionFormValues) => {
    setIsSubmitting(true);
    try {
      const newSession = await createOPDSession(hospitalId, values);
      setSessions((prev) => [newSession, ...prev]);
      setBannerMessage({
        type: "success",
        text: `OPD session for ${newSession.doctorName} on ${newSession.date} created successfully.`,
      });
      setTimeout(() => setBannerMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transition Session State Handler
  const handleTransition = async (
    sessionId: string,
    action: SessionTransitionAction,
    options?: { reason?: string }
  ) => {
    setIsTransitioning(true);
    try {
      const { session: updated } = await transitionOPDSession(
        hospitalId,
        sessionId,
        action,
        {
          actorRole: "admin",
          reason: options?.reason,
        }
      );

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s))
      );

      if (selectedSession?.id === sessionId) {
        setSelectedSession(updated);
      }

      setBannerMessage({
        type: "success",
        text: `Session ${sessionId} successfully transitioned via '${action}' (${updated.status}).`,
      });
      setTimeout(() => setBannerMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "State transition failed";
      setBannerMessage({ type: "error", text: msg });
      setTimeout(() => setBannerMessage(null), 6000);
      throw err;
    } finally {
      setIsTransitioning(false);
    }
  };

  // Metrics Aggregations
  const metrics = useMemo(() => {
    const todaySessions = sessions.filter((s) => s.date === todayStr);
    return {
      totalToday: todaySessions.length,
      active: todaySessions.filter((s) => s.status === "active").length,
      paused: todaySessions.filter((s) => s.status === "paused").length,
      completed: todaySessions.filter((s) => s.status === "completed").length,
      scheduled: todaySessions.filter((s) => s.status === "scheduled").length,
    };
  }, [sessions, todayStr]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === "" ||
        session.id.toLowerCase().includes(q) ||
        session.doctorName.toLowerCase().includes(q) ||
        session.departmentName.toLowerCase().includes(q) ||
        session.roomNumber.toLowerCase().includes(q);

      const matchesDept =
        selectedDeptId === "all" || session.departmentId === selectedDeptId;

      const matchesStatus =
        selectedStatus === "all" || session.status === selectedStatus;

      let matchesTimeframe = true;
      if (timeframeView === "today") {
        matchesTimeframe = session.date === todayStr;
      } else if (timeframeView === "upcoming") {
        matchesTimeframe = session.date > todayStr;
      } else if (timeframeView === "past") {
        matchesTimeframe = session.date < todayStr;
      }

      return matchesSearch && matchesDept && matchesStatus && matchesTimeframe;
    });
  }, [
    sessions,
    searchQuery,
    selectedDeptId,
    selectedStatus,
    timeframeView,
    todayStr,
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1 font-semibold text-[11px]">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold text-[11px]">
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-semibold text-[11px]">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="font-semibold text-[11px]">
            Cancelled
          </Badge>
        );
      case "scheduled":
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30 font-semibold text-[11px]">
            Scheduled
          </Badge>
        );
    }
  };

  const formatTime = (ts?: unknown) => {
    if (!ts) return "—";
    try {
      const d = new Date(String(ts));
      if (isNaN(d.getTime())) return String(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return String(ts);
    }
  };

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
          Unable to Load OPD Sessions
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="size-4 mr-1.5" />
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

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            OPD Operating Sessions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage daily outpatient clinical operating sessions, track real-time clinic throughput, and record operational state events.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            <Plus className="size-4" />
            Create OPD Session
          </Button>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Sessions Today
              </span>
              <Calendar className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">
              {metrics.totalToday}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.scheduled} scheduled • {metrics.completed} finished
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Active Clinics Right Now
              </span>
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              {metrics.active}
              {metrics.active > 0 && (
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
              Doctors conducting live consultations
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Paused / Temporary Break
              </span>
              <Pause className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
              {metrics.paused}
            </div>
            <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
              Emergency consult or lunch break
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Completed Today
              </span>
              <CheckCircle2 className="size-4 text-slate-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {metrics.completed}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Concluded clinic shifts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Timeframe Navigation */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        {/* Timeframe View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
            <button
              onClick={() => setTimeframeView("today")}
              className={`rounded-md px-3 py-1 transition-colors ${
                timeframeView === "today"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today&apos;s Sessions
            </button>
            <button
              onClick={() => setTimeframeView("upcoming")}
              className={`rounded-md px-3 py-1 transition-colors ${
                timeframeView === "upcoming"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeframeView("past")}
              className={`rounded-md px-3 py-1 transition-colors ${
                timeframeView === "past"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Historical
            </button>
            <button
              onClick={() => setTimeframeView("all")}
              className={`rounded-md px-3 py-1 transition-colors ${
                timeframeView === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Records
            </button>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing {filteredSessions.length} sessions
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor, room, department, session ID..."
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Clinical Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Operational Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
            <Calendar className="size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              No OPD Sessions Found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              No sessions match the selected timeframe or search criteria. Create a new OPD operating session or adjust your filters.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFormOpen(true)}
              className="mt-4 gap-1.5"
            >
              <Plus className="size-3.5" />
              Create Session
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase">
                  <th className="py-3 px-4">Session & Date</th>
                  <th className="py-3 px-4">Doctor & Department</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Scheduled Window</th>
                  <th className="py-3 px-4">Tokens / Progress</th>
                  <th className="py-3 px-4">Actual Times</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Session ID & Date */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-foreground">
                        {session.date}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {session.id}
                      </div>
                    </td>

                    {/* Doctor & Department */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">
                        {session.doctorName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {session.departmentName}
                      </div>
                    </td>

                    {/* Room */}
                    <td className="py-3 px-4 font-mono">
                      <Badge variant="outline" className="text-[10px]">
                        Room {session.roomNumber}
                      </Badge>
                    </td>

                    {/* Scheduled Window */}
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-primary" />
                        {session.startTime} – {session.endTime}
                      </span>
                    </td>

                    {/* Tokens / Progress */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className="text-muted-foreground">Done:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {session.completedCount ?? 0}
                        </span>
                        <span className="text-muted-foreground">• Wait:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {session.waitingCount ?? 0}
                        </span>
                      </div>
                      {session.currentRunningToken !== null && (
                        <div className="text-[10px] font-mono text-primary mt-0.5">
                          Running: #{session.currentRunningToken}
                        </div>
                      )}
                    </td>

                    {/* Actual Times */}
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      <div>Start: {formatTime(session.startedAt)}</div>
                      <div>End: {formatTime(session.completedAt)}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {getStatusBadge(session.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Start */}
                        {session.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] gap-1 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/10"
                            onClick={() => handleTransition(session.id, "start")}
                            disabled={isTransitioning}
                            title="Start OPD Session"
                          >
                            <Play className="size-3 fill-current" />
                            Start
                          </Button>
                        )}

                        {/* Quick Pause */}
                        {session.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] gap-1 text-amber-700 border-amber-500/30 hover:bg-amber-500/10"
                            onClick={() => handleTransition(session.id, "pause")}
                            disabled={isTransitioning}
                            title="Pause OPD Session"
                          >
                            <Pause className="size-3 fill-current" />
                            Pause
                          </Button>
                        )}

                        {/* Quick Resume */}
                        {session.status === "paused" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] gap-1 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/10"
                            onClick={() => handleTransition(session.id, "resume")}
                            disabled={isTransitioning}
                            title="Resume OPD Session"
                          >
                            <Play className="size-3 fill-current" />
                            Resume
                          </Button>
                        )}

                        {/* Quick Complete */}
                        {(session.status === "active" || session.status === "paused") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] gap-1 text-slate-700 dark:text-slate-200 hover:bg-muted"
                            onClick={() => handleTransition(session.id, "complete")}
                            disabled={isTransitioning}
                            title="Complete OPD Session"
                          >
                            <CheckCircle2 className="size-3" />
                            Complete
                          </Button>
                        )}

                        {/* Open Details Dialog */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedSession(session);
                            setIsDetailsOpen(true);
                          }}
                          title="View Session Details & Audit Trail"
                        >
                          <Eye className="size-3.5 mr-1" />
                          Details
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

      {/* Create Session Dialog */}
      <SessionFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateSession}
        departments={departments}
        doctors={doctors}
        isSubmitting={isSubmitting}
      />

      {/* Session Details & Audit Dialog */}
      <SessionDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
        hospitalId={hospitalId}
        onTransition={handleTransition}
        isTransitioning={isTransitioning}
      />
    </div>
  );
}
