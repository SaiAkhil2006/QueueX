"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { DashboardData } from "../types";
import { fetchStaffDashboard } from "../services/dashboard.client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Plus,
  Radio,
  History,
  Layers,
} from "lucide-react";

interface DashboardViewProps {
  hospitalId?: string;
}

export function DashboardView({
  hospitalId = "hosp-vzg-001",
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  const loadData = useCallback(
    async (isBackground = false) => {
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const result = await fetchStaffDashboard(hospitalId);
        setData(result);
        setError(null);
        setLastRefreshedAt(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch (err: unknown) {
        if (!isBackground) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load operational dashboard data"
          );
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [hospitalId]
  );

  useEffect(() => {
    let ignore = false;
    async function initialLoad() {
      try {
        const result = await fetchStaffDashboard(hospitalId);
        if (!ignore) {
          setData(result);
          setError(null);
          setLastRefreshedAt(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load operational dashboard data"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initialLoad();
    return () => {
      ignore = true;
    };
  }, [hospitalId]);

  // Real-time background auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const formatTimestamp = (ts?: unknown) => {
    if (!ts) return "—";
    try {
      const d = new Date(String(ts));
      if (isNaN(d.getTime())) return String(ts);
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return String(ts);
    }
  };

  const getAvailabilityBadge = (avail: string) => {
    switch (avail) {
      case "available":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
            Available
          </Badge>
        );
      case "busy":
        return (
          <Badge className="bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30 text-[10px]">
            In Consult
          </Badge>
        );
      case "on_break":
        return (
          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px]">
            On Break
          </Badge>
        );
      case "off_duty":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            Off Duty
          </Badge>
        );
    }
  };

  const getSessionStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="text-[11px] text-muted-foreground italic">
          No active session
        </span>
      );
    }
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1 text-[10px] font-semibold">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Clinic
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px]">
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 text-[10px]">
            Concluded
          </Badge>
        );
      case "scheduled":
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-800 dark:text-blue-300 text-[10px]">
            Scheduled
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 w-full lg:col-span-2" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-foreground">
          Unable to Load Operational Dashboard
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => loadData(false)} variant="outline" size="sm">
            <RefreshCw className="size-4 mr-1.5" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  const { hospital, sessionsSummary, departments, doctors, upcomingSessions, recentEvents } = data;

  return (
    <div className="space-y-8">
      {/* SECTION A: Hospital Overview & Telemetry Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs text-card-foreground">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary font-semibold text-xs"
              >
                {hospital.hospitalName}
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold capitalize"
              >
                Operating Status: {hospital.operatingStatus}
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary text-[11px] font-mono"
              >
                {hospital.activeDepartmentsCount} / {hospital.totalDepartmentsCount} Depts Online
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary text-[11px] font-mono"
              >
                {hospital.activeDoctorsCount} / {hospital.totalDoctorsCount} Doctors Roster
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              OPD Operations Command Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Centralized operational intelligence dashboard aggregating active outpatient clinic sessions, doctor availability, department workloads, and disruption telemetry.
            </p>
          </div>

          {/* Quick Actions & Live Telemetry Controls */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="text-xs font-semibold gap-1.5"
              title="Manually fetch latest Firestore records"
            >
              <RefreshCw
                className={cn("size-3.5", isRefreshing && "animate-spin")}
              />
              <span>{isRefreshing ? "Updating..." : "Refresh"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "text-xs gap-1.5 border",
                autoRefresh
                  ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                  : "border-border text-muted-foreground"
              )}
              title="Toggle automatic 10s telemetry polling"
            >
              <Radio className={cn("size-3.5", autoRefresh && "animate-pulse")} />
              <span>{autoRefresh ? "Live 10s Auto" : "Auto Paused"}</span>
            </Button>

            <Link
              href="/sessions"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500 font-semibold shadow-xs text-xs gap-1.5"
              )}
            >
              <Layers className="size-3.5" />
              Manage Sessions
            </Link>
          </div>
        </div>

        {/* Date & Mode Bar */}
        <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-primary" />
            <span>{hospital.currentDateFormatted} • Live Production Telemetry</span>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshedAt && (
              <span className="font-mono text-[11px]">
                Last synced: {lastRefreshedAt}
              </span>
            )}
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5"
            >
              Real Firestore Persistence Active
            </Badge>
          </div>
        </div>
      </div>

      {/* SECTION B: OPD Session Overview Cards */}
      <section aria-labelledby="sessions-overview-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="sessions-overview-title" className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wider">
            Today&apos;s OPD Operating Sessions
          </h2>
          <Link
            href="/sessions?view=today"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View Detailed Roster</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total Today */}
          <Link href="/sessions?view=today" className="block group">
            <Card className="border shadow-xs hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                  <span>Total Today</span>
                  <Calendar className="size-4 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {sessionsSummary.totalToday}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Scheduled clinic shifts
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Active Sessions */}
          <Link href="/sessions?status=active" className="block group">
            <Card className="border shadow-xs bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500 transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                  <span>Active Now</span>
                  <Play className="size-4 fill-current" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  {sessionsSummary.active}
                  {sessionsSummary.active > 0 && (
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  Open doctor consults
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Paused Sessions */}
          <Link href="/sessions?status=paused" className="block group">
            <Card className="border shadow-xs bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 hover:border-amber-500 transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-medium">
                  <span>Paused</span>
                  <Pause className="size-4 fill-current" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                  {sessionsSummary.paused}
                </div>
                <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  Temporary intermission
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Scheduled Sessions */}
          <Link href="/sessions?status=scheduled" className="block group">
            <Card className="border shadow-xs hover:border-blue-500/50 transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 text-xs font-medium">
                  <span>Scheduled</span>
                  <Clock className="size-4" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-300">
                  {sessionsSummary.scheduled}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Awaiting doctor start
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Completed Sessions */}
          <Link href="/sessions?status=completed" className="block group">
            <Card className="border shadow-xs hover:border-slate-500/50 transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-xs font-medium">
                  <span>Completed</span>
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {sessionsSummary.completed}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Finished shifts
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* SECTION C & D: Department Activity & Doctor Availability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SECTION C: Department Overview */}
        <Card className="border shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Clinical Departments Overview
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time staffing and session density across hospital wings.
              </CardDescription>
            </div>
            <Link
              href="/departments"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] font-semibold text-muted-foreground uppercase">
                    <th className="pb-2.5">Department</th>
                    <th className="pb-2.5">Assigned</th>
                    <th className="pb-2.5">Active Docs</th>
                    <th className="pb-2.5 text-center">Active Clinics</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5">
                        <div className="font-semibold text-foreground">
                          {dept.name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {dept.code}
                        </div>
                      </td>
                      <td className="py-2.5 font-mono text-muted-foreground">
                        {dept.assignedDoctorsCount} doctors
                      </td>
                      <td className="py-2.5 font-mono text-foreground font-semibold">
                        {dept.activeDoctorsCount} on duty
                      </td>
                      <td className="py-2.5 text-center">
                        {dept.activeSessionsCount > 0 ? (
                          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                            {dept.activeSessionsCount} Live
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={cn(
                            "inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize border",
                            dept.operationalStatus === "busy" &&
                              "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
                            dept.operationalStatus === "active" &&
                              "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
                            dept.operationalStatus === "inactive" &&
                              "bg-muted text-muted-foreground border-border",
                            dept.operationalStatus === "normal" &&
                              "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30"
                          )}
                        >
                          {dept.operationalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SECTION D: Doctor Availability */}
        <Card className="border shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="size-4 text-primary" />
                Doctor Availability & Clinic State
              </CardTitle>
              <CardDescription className="text-xs">
                Clinical staff duty state, active rooms, and upcoming shifts.
              </CardDescription>
            </div>
            <Link
              href="/doctors"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] font-semibold text-muted-foreground uppercase sticky top-0 bg-card">
                    <th className="pb-2.5">Doctor</th>
                    <th className="pb-2.5">Department & Room</th>
                    <th className="pb-2.5">Availability</th>
                    <th className="pb-2.5 text-right">Session State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {doctors.slice(0, 10).map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5">
                        <div className="font-semibold text-foreground">
                          {doc.name}
                        </div>
                        {doc.nextSession ? (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-2.5" />
                            Next: {doc.nextSession.date} ({doc.nextSession.startTime})
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2.5">
                        <div className="text-foreground">{doc.departmentName}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          Room {doc.roomNumber}
                        </div>
                      </td>
                      <td className="py-2.5">
                        {getAvailabilityBadge(doc.availability)}
                      </td>
                      <td className="py-2.5 text-right">
                        {getSessionStatusBadge(doc.currentSessionStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION E & F: Upcoming Sessions & Recent Operational Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SECTION E: Upcoming Sessions */}
        <Card className="border shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Upcoming OPD Sessions
              </CardTitle>
              <CardDescription className="text-xs">
                Chronological schedule of upcoming doctor shifts.
              </CardDescription>
            </div>
            <Link
              href="/sessions?view=upcoming"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>All Sessions</span>
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {upcomingSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center italic">
                No upcoming sessions scheduled. Create an OPD session to start.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {upcomingSessions.slice(0, 6).map((ses) => (
                  <div
                    key={ses.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">
                        {ses.doctorName}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{ses.departmentName}</span>
                        <span>•</span>
                        <span className="font-mono">Room {ses.roomNumber}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5 font-mono">
                      <div className="text-[11px] text-foreground font-semibold">
                        {ses.date}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {ses.startTime} – {ses.endTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION F: Recent Operational Activity */}
        <Card className="border shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <History className="size-4 text-primary" />
                Recent Operational Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time audit log of OPD session state changes and events.
              </CardDescription>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {recentEvents.length} events logged
            </span>
          </CardHeader>
          <CardContent className="flex-1">
            {recentEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center italic">
                No operational activity recorded yet. State changes will stream here.
              </p>
            ) : (
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto pr-1">
                {recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="py-2.5 first:pt-0 last:pb-0 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono capitalize">
                        {evt.eventType.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatTimestamp(evt.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground leading-snug">
                      {evt.description}
                    </p>
                    {evt.metadata?.reason ? (
                      <p className="text-[10px] text-muted-foreground italic">
                        Reason: &quot;{String(evt.metadata.reason)}&quot;
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION G: Quick Actions Bar */}
      <section aria-labelledby="quick-actions-title" className="space-y-3">
        <h2 id="quick-actions-title" className="text-xs font-bold tracking-tight text-muted-foreground uppercase tracking-wider">
          Operational Navigation & Management Shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            href="/doctors"
            className="flex items-center gap-2.5 rounded-lg border bg-card p-3 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground group"
          >
            <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:scale-105 transition-transform">
              <Stethoscope className="size-4" />
            </div>
            <div className="truncate">
              <div>Register Doctor</div>
              <div className="text-[10px] font-normal text-muted-foreground">Staff profiles</div>
            </div>
          </Link>

          <Link
            href="/departments"
            className="flex items-center gap-2.5 rounded-lg border bg-card p-3 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground group"
          >
            <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:scale-105 transition-transform">
              <Building2 className="size-4" />
            </div>
            <div className="truncate">
              <div>Add Department</div>
              <div className="text-[10px] font-normal text-muted-foreground">Clinical units</div>
            </div>
          </Link>

          <Link
            href="/schedules"
            className="flex items-center gap-2.5 rounded-lg border bg-card p-3 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground group"
          >
            <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:scale-105 transition-transform">
              <Clock className="size-4" />
            </div>
            <div className="truncate">
              <div>Configure Schedules</div>
              <div className="text-[10px] font-normal text-muted-foreground">Weekly rosters</div>
            </div>
          </Link>

          <Link
            href="/sessions"
            className="flex items-center gap-2.5 rounded-lg border bg-card p-3 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground group"
          >
            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 group-hover:scale-105 transition-transform">
              <Plus className="size-4" />
            </div>
            <div className="truncate">
              <div>Create OPD Session</div>
              <div className="text-[10px] font-normal text-muted-foreground">Daily operations</div>
            </div>
          </Link>

          <Link
            href="/hospital"
            className="flex items-center gap-2.5 rounded-lg border bg-card p-3 shadow-xs hover:border-primary/50 hover:bg-muted/40 transition-colors text-xs font-semibold text-foreground group"
          >
            <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:scale-105 transition-transform">
              <Building2 className="size-4" />
            </div>
            <div className="truncate">
              <div>Hospital Config</div>
              <div className="text-[10px] font-normal text-muted-foreground">Facility settings</div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
