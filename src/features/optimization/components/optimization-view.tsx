"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  TrendingDown,
  AlertOctagon,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRecommendations,
  generateRecommendations,
  applyRecommendation,
  dismissRecommendation,
  getDepartmentWorkload,
} from "../services/optimization.client";
import { fetchDepartments } from "@/features/departments/services/departments.client";
import type { Recommendation } from "@/types/intelligence";
import type { DepartmentWorkload } from "../services/optimization.server";
import type { Department } from "@/types/department";

interface OptimizationViewProps {
  hospitalId: string;
}

export function OptimizationView({ hospitalId }: OptimizationViewProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [workload, setWorkload] = useState<DepartmentWorkload | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      try {
        const [depts, recs] = await Promise.all([
          fetchDepartments(hospitalId),
          getRecommendations(hospitalId),
        ]);
        if (ignore) return;
        setDepartments(depts);
        setRecommendations(recs);

        const targetDept = depts[0]?.id || "";
        if (targetDept) {
          setSelectedDeptId(targetDept);
          const wl = await getDepartmentWorkload(hospitalId, targetDept).catch(() => null);
          if (ignore) return;
          setWorkload(wl);
        }
      } catch (err) {
        console.error("Failed to load optimization data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchInitial();
    return () => {
      ignore = true;
    };
  }, [hospitalId]);

  const handleSelectDepartment = async (deptId: string) => {
    setSelectedDeptId(deptId);
    try {
      const [wl, recs] = await Promise.all([
        getDepartmentWorkload(hospitalId, deptId).catch(() => null),
        getRecommendations(hospitalId, { departmentId: deptId }),
      ]);
      setWorkload(wl);
      setRecommendations(recs);
    } catch (err) {
      console.error("Failed to change department workload:", err);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateRecommendations(hospitalId, selectedDeptId || undefined);
      const [refreshedRecs, refreshedWl] = await Promise.all([
        getRecommendations(hospitalId, selectedDeptId ? { departmentId: selectedDeptId } : undefined),
        selectedDeptId ? getDepartmentWorkload(hospitalId, selectedDeptId).catch(() => null) : null,
      ]);
      setRecommendations(refreshedRecs);
      if (refreshedWl) setWorkload(refreshedWl);
    } catch (err) {
      console.error("Failed to generate recommendations:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async (recId: string) => {
    try {
      setProcessingId(recId);
      await applyRecommendation(hospitalId, recId);
      const [refreshedRecs, refreshedWl] = await Promise.all([
        getRecommendations(hospitalId, selectedDeptId ? { departmentId: selectedDeptId } : undefined),
        selectedDeptId ? getDepartmentWorkload(hospitalId, selectedDeptId).catch(() => null) : null,
      ]);
      setRecommendations(refreshedRecs);
      if (refreshedWl) setWorkload(refreshedWl);
    } catch (err) {
      console.error("Failed to apply recommendation:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (recId: string) => {
    try {
      setProcessingId(recId);
      await dismissRecommendation(hospitalId, recId);
      const refreshedRecs = await getRecommendations(
        hospitalId,
        selectedDeptId ? { departmentId: selectedDeptId } : undefined
      );
      setRecommendations(refreshedRecs);
    } catch (err) {
      console.error("Failed to dismiss recommendation:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRecommendations = recommendations.filter((r) => r.status === "pending");
  const appliedRecommendations = recommendations.filter((r) => r.status === "applied");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dynamic OPD Optimization & Bottleneck Intelligence
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <Zap className="size-3" />
              Prescriptive Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time workload rebalancing, doctor pace leveling, and actionable operational mitigation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${generating ? "animate-spin" : ""}`} />
            Scan Bottlenecks & Optimize
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Actions
            </CardTitle>
            <Sparkles className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {pendingRecommendations.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require operational authorization
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Queue Imbalance
            </CardTitle>
            <AlertOctagon className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workload?.hasImbalance ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Detected (Δ {workload.imbalanceDelta})
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">Balanced</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {workload?.hasImbalance
                ? "Physician queue delta exceeds 2x"
                : "Active workloads evenly distributed"}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Optimizations Applied
            </CardTitle>
            <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {appliedRecommendations.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Workload transfers executed
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dept Total Waiting
            </CardTitle>
            <Users className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workload?.totalWaiting ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {workload?.activeSessions.length ?? 0} active OPD rooms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 rounded-xl border">
        <Stethoscope className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Select Department:</span>
        <select
          value={selectedDeptId}
          onChange={(e) => handleSelectDepartment(e.target.value)}
          className="px-3 py-1.5 text-sm bg-background border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {/* Department Workload Distribution Grid */}
      {workload && workload.activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Physician Workload Distribution — {workload.departmentName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workload.activeSessions.map((s) => (
              <Card
                key={s.sessionId}
                className={`border shadow-xs transition-all ${
                  workload.hasImbalance && s.waitingCount >= 3
                    ? "border-amber-500/40 bg-amber-500/5"
                    : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{s.doctorName}</CardTitle>
                    <Badge variant="outline">Room {s.roomNumber}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Waiting Patients:</span>
                    <span className="font-mono font-bold text-lg text-foreground">
                      {s.waitingCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Estimated Backlog:</span>
                    <span className="font-semibold text-sm text-foreground">
                      ~{s.estimatedBacklogMinutes} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t text-xs">
                    <span className="text-muted-foreground">Current Status:</span>
                    {s.inConsultation ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Consulting {s.activeTokenDisplay}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Ready for Next</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations Queue */}
      <Card className="border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              Actionable Optimization Recommendations
            </CardTitle>
            <Badge variant="secondary">
              {pendingRecommendations.length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Evaluating OPD queue patterns...
            </div>
          ) : pendingRecommendations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle className="size-8 text-emerald-500 mx-auto opacity-70" />
              <p className="text-sm font-medium text-foreground">No Bottlenecks Detected</p>
              <p className="text-xs text-muted-foreground">
                All queues are balanced. QueueX will alert you immediately if any doctor experiences overload.
              </p>
            </div>
          ) : (
            pendingRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rec.priority === "urgent"
                          ? "destructive"
                          : rec.priority === "high"
                          ? "default"
                          : "secondary"
                      }
                      className="uppercase text-xs"
                    >
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rec.type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  {rec.impactEstimate && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingDown className="size-3.5" />
                      {rec.impactEstimate}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground text-sm">{rec.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={processingId === rec.id}
                    onClick={() => handleDismiss(rec.id)}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <XCircle className="size-3.5" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    disabled={processingId === rec.id}
                    onClick={() => handleApply(rec.id)}
                    className="gap-1.5 text-xs bg-primary"
                  >
                    <CheckCircle className="size-3.5" />
                    Apply Recommendation
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Applied History */}
      {appliedRecommendations.length > 0 && (
        <Card className="border shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-500" />
              Applied Optimizations Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {appliedRecommendations.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs"
              >
                <div>
                  <div className="font-medium text-foreground">{rec.title}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    {rec.description}
                  </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                  Applied
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
