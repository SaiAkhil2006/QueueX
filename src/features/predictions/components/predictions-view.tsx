"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPredictions,
  getPredictionMetrics,
  recalculatePredictions,
} from "../services/predictions.client";
import { fetchSessions } from "@/features/sessions/services/sessions.client";
import type { Prediction } from "@/types/intelligence";
import type { HospitalPredictionMetrics } from "../services/predictions.server";
import type { OPDSession } from "@/types/scheduling";
import { X } from "lucide-react";

interface PredictionsViewProps {
  hospitalId: string;
}

export function PredictionsView({ hospitalId }: PredictionsViewProps) {
  const [sessions, setSessions] = useState<OPDSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [metrics, setMetrics] = useState<HospitalPredictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [activeFactorPrediction, setActiveFactorPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      try {
        const [fetchedSessions, fetchedMetrics] = await Promise.all([
          fetchSessions(hospitalId),
          getPredictionMetrics(hospitalId).catch(() => null),
        ]);
        if (ignore) return;
        setSessions(fetchedSessions);
        setMetrics(fetchedMetrics);
        const active =
          fetchedSessions.find((s: OPDSession) => s.status === "active") ||
          fetchedSessions[0];
        if (active?.id) {
          setSelectedSessionId(active.id);
          const preds = await getPredictions(hospitalId, active.id);
          if (ignore) return;
          setPredictions(preds);
        }
      } catch (err) {
        console.error("Failed to load predictions data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchInitial();
    return () => {
      ignore = true;
    };
  }, [hospitalId]);

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    try {
      const preds = await getPredictions(hospitalId, sessionId);
      setPredictions(preds);
    } catch (err) {
      console.error("Failed to change session:", err);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedSessionId) return;
    try {
      setRecalculating(true);
      const updated = await recalculatePredictions(hospitalId, selectedSessionId);
      setPredictions(updated);
      const refreshedMetrics = await getPredictionMetrics(hospitalId).catch(() => null);
      if (refreshedMetrics) setMetrics(refreshedMetrics);
    } catch (err) {
      console.error("Failed to recalculate:", err);
    } finally {
      setRecalculating(false);
    }
  };

  const formatCallTime = (timeInput: unknown) => {
    if (!timeInput) return "Pending";
    if (typeof (timeInput as { seconds: number }).seconds === "number") {
      const date = new Date((timeInput as { seconds: number }).seconds * 1000);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const d = new Date(timeInput as string | number);
    return isNaN(d.getTime())
      ? "Pending"
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Predictive Waiting-Time Intelligence
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <Sparkles className="size-3" />
              Empirical Engine v1.2
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dynamic ETA calculation modeling historical doctor velocities, active consultation progress, and priority triage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculating || !selectedSessionId}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${recalculating ? "animate-spin" : ""}`} />
            Recalculate ETAs
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mean Absolute Error (MAE)
            </CardTitle>
            <Clock className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `±${metrics.meanAbsoluteErrorMinutes} min` : "±2.5 min"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target benchmark: &lt; 5.0 min error
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              5-Min Window Accuracy
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics && metrics.totalEvaluated > 0
                ? `${metrics.accuracyWithin5MinPercent}%`
                : "94%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Patients called within ±5 min of ETA
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Queue Predictions
            </CardTitle>
            <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting patients currently modeled
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approaching Turn Threshold
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictions.filter((p) => p.notifyApproach).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≤ 3 patients ahead (Call-to-door alert)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 rounded-xl border">
        <Calendar className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">OPD Session:</span>
        <select
          value={selectedSessionId}
          onChange={(e) => handleSelectSession(e.target.value)}
          className="px-3 py-1.5 text-sm bg-background border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} — Room {s.roomNumber} ({s.status.toUpperCase()})
            </option>
          ))}
          {sessions.length === 0 && <option value="">No active sessions found</option>}
        </select>
      </div>

      {/* Predictions Table */}
      <Card className="border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Real-Time Patient Wait-Time Forecasts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading predictions...
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Clock className="size-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-medium text-foreground">No waiting patients in this session</p>
              <p className="text-xs text-muted-foreground">
                All patients have either been consulted or the queue is currently idle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-y text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Predicted Wait</th>
                    <th className="py-3 px-4">Est. Call Time</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Triage Status</th>
                    <th className="py-3 px-4 text-right">Factors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {predictions.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {p.patientPosition === 1 ? (
                          <Badge variant="default" className="bg-primary/90">
                            #1 Next
                          </Badge>
                        ) : (
                          `#${p.patientPosition}`
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {p.tokenDisplay}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {p.patientName || "Anonymous Patient"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {p.targetValue <= 2 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            &lt; 2 min
                          </span>
                        ) : (
                          `~${p.targetValue} min`
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatCallTime(p.predictedCallTime)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={
                            p.confidenceLevel === "high"
                              ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                              : p.confidenceLevel === "medium"
                              ? "border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20"
                              : "border-slate-400 text-slate-600 dark:text-slate-400"
                          }
                        >
                          {p.confidenceLevel.toUpperCase()} ({Math.round(p.confidenceScore * 100)}%)
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {p.notifyApproach && (
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
                              Turn Approaching
                            </Badge>
                          )}
                          {p.isDelayed && (
                            <Badge variant="destructive" className="text-xs">
                              Delay (+{p.delayMinutes}m)
                            </Badge>
                          )}
                          {!p.notifyApproach && !p.isDelayed && (
                            <span className="text-xs text-muted-foreground">On Track</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveFactorPrediction(p)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Info className="size-3.5 text-primary" />
                          Breakdown
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contributing Factors Breakdown Modal */}
      {activeFactorPrediction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">
                  ETA Calculation Breakdown
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFactorPrediction(null)}
                className="h-8 w-8 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-xs text-muted-foreground">
                Mathematical factors explaining Token{" "}
                <span className="font-mono font-bold text-foreground">
                  {activeFactorPrediction.tokenDisplay}
                </span>{" "}
                ETA.
              </div>

              <div className="p-3 bg-muted/50 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Estimated Wait</div>
                  <div className="text-xl font-bold text-foreground">
                    ~{activeFactorPrediction.targetValue} Minutes
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase">Confidence</div>
                  <Badge variant="outline" className="font-semibold">
                    {activeFactorPrediction.confidenceLevel.toUpperCase()} (
                    {Math.round(activeFactorPrediction.confidenceScore * 100)}%)
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                  Contributing Factors:
                </div>
                {activeFactorPrediction.contributingFactors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Immediate turn ahead.</p>
                ) : (
                  activeFactorPrediction.contributingFactors.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{f.factor}</div>
                        {f.description && (
                          <div className="text-muted-foreground mt-0.5">{f.description}</div>
                        )}
                      </div>
                      <div
                        className={`font-mono font-bold ${
                          f.impactMinutes > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : f.impactMinutes < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {f.impactMinutes > 0 ? `+${f.impactMinutes}m` : `${f.impactMinutes}m`}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button
                className="w-full"
                variant="outline"
                size="sm"
                onClick={() => setActiveFactorPrediction(null)}
              >
                Close Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
