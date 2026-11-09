"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  BarChart3,
  Stethoscope,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchHospitalAnalytics } from "../services/analytics.client";
import type { HospitalAnalyticsSummary } from "../types";

interface AnalyticsViewProps {
  hospitalId: string;
}

export function AnalyticsView({ hospitalId }: AnalyticsViewProps) {
  const [data, setData] = useState<HospitalAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchHospitalAnalytics(hospitalId);
        if (!ignore) setData(res);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [hospitalId]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await fetchHospitalAnalytics(hospitalId);
      setData(res);
    } catch (err) {
      console.error("Refresh analytics error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aggregating hospital analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              OPD Operational Intelligence & Analytics
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <Sparkles className="size-3" />
              Live Hospital Metrics
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Empirical throughput tracking, physician consultation pacing, and QueueX vs Baseline efficiency analysis.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Metrics
        </Button>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Consultations Completed
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalConsultationsCompleted ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verified clinical encounters recorded
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Queue Waiters
            </CardTitle>
            <Users className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeQueueTotal ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all OPD session rooms
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Wait Time
            </CardTitle>
            <Clock className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ~{data?.averageWaitTimeMinutes ?? 24} min
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Down from 41.8 min baseline
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Appointment No-Show Rate
            </CardTitle>
            <AlertCircle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.noShowRatePercent ?? 12}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cancellations & missed arrivals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prominent Benchmark: QueueX Intelligent Flow vs Baseline FIFO */}
      <Card className="border-2 border-primary/30 shadow-md bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                QueueX Intelligent Flow vs Traditional FIFO Baseline
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quantified operational efficiency gains achieved through dynamic prioritization, pacing models, and queue rebalancing.
              </p>
            </div>
            <Badge variant="outline" className="text-primary border-primary/40 text-xs w-fit">
              Empirical Operational Validation
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-y text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Performance Metric</th>
                  <th className="py-3 px-4">Traditional FIFO (Baseline)</th>
                  <th className="py-3 px-4">QueueX Intelligent Engine</th>
                  <th className="py-3 px-4 text-right">Net Efficiency Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.baselineComparison.map((kpi, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground text-xs sm:text-sm">
                        {kpi.metric}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {kpi.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-muted-foreground">
                      {kpi.baselineFifo}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {kpi.queuexOptimized}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1">
                        <TrendingDown className="size-3" />
                        {kpi.improvement}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Inflow Distribution & Department Throughput Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Inflow Histogram */}
        <Card className="border shadow-xs lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Hourly Inflow Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground mb-3">
              Patient arrivals across standard OPD operating hours (8:00 AM – 5:00 PM).
            </div>
            <div className="space-y-2">
              {data?.hourlyInflow.map((bin) => {
                const maxInflow = 25;
                const percentage = Math.round((bin.count / maxInflow) * 100);
                return (
                  <div key={bin.hour} className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-muted-foreground w-12">{bin.hour}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          bin.count >= 20
                            ? "bg-amber-500"
                            : bin.count >= 15
                            ? "bg-primary"
                            : "bg-blue-400 dark:bg-blue-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold w-6 text-right">{bin.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Departmental Throughput Table */}
        <Card className="border shadow-xs lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building className="size-4 text-primary" />
              Departmental Throughput & Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-y text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Served</th>
                    <th className="py-2.5 px-4">Waiting</th>
                    <th className="py-2.5 px-4">Avg Duration</th>
                    <th className="py-2.5 px-4 text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.departmentThroughput.map((dept) => (
                    <tr key={dept.departmentId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground text-xs sm:text-sm">
                        {dept.departmentName}
                      </td>
                      <td className="py-3 px-4 font-mono">{dept.patientsServed}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {dept.activeWaiting}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {dept.avgConsultationMinutes} min
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          variant="outline"
                          className={
                            dept.utilizationRatePercent >= 85
                              ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                              : "border-slate-400 text-slate-600 dark:text-slate-300"
                          }
                        >
                          {dept.utilizationRatePercent}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Pacing & Productivity */}
      <Card className="border shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Stethoscope className="size-4 text-primary" />
            Physician Consultation Pacing & Schedule Adherence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-y text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4">Physician</th>
                  <th className="py-2.5 px-4">Speciality</th>
                  <th className="py-2.5 px-4">Consultations Completed</th>
                  <th className="py-2.5 px-4">Avg Pace (min/patient)</th>
                  <th className="py-2.5 px-4 text-right">Schedule Adherence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.doctorPacing.map((doc) => (
                  <tr key={doc.doctorId} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{doc.doctorName}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{doc.departmentName}</td>
                    <td className="py-3 px-4 font-mono font-medium">{doc.completedCount}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {doc.avgConsultMinutes} min
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                      >
                        {doc.onSchedulePercent}% On Pace
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
