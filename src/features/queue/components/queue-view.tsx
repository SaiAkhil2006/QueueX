"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  LiveSessionQueueState,
  QueueEntry,
  CompleteConsultationPayload,
  QueuePriority,
} from "../types";
import type { OPDSession } from "@/types/scheduling";
import {
  fetchSessionQueueState,
  createQueueEntryClient,
  callNextPatientClient,
  startConsultationClient,
  completeConsultationClient,
  skipPatientClient,
  recallPatientClient,
  updateQueuePriorityClient,
} from "../services/queue.client";
import { fetchSessions } from "@/features/sessions/services/sessions.client";
import { CompleteConsultationDialog } from "./complete-consultation-dialog";
import { EmergencyTokenDialog } from "./emergency-token-dialog";
import {
  Users,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  Siren,
  SkipForward,
  RotateCcw,
  Stethoscope,
  DoorOpen,
  ShieldAlert,
} from "lucide-react";

interface QueueViewProps {
  hospitalId: string;
}

export function QueueView({ hospitalId }: QueueViewProps) {
  const [sessions, setSessions] = useState<OPDSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [queueState, setQueueState] = useState<LiveSessionQueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Modals
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completingEntry, setCompletingEntry] = useState<QueueEntry | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Active Consultation running timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load available sessions for today
  useEffect(() => {
    let active = true;
    async function loadSessions() {
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const allSessions = await fetchSessions(hospitalId, { date: todayStr });
        if (!active) return;
        setSessions(allSessions);
        if (allSessions.length > 0) {
          const activeOrScheduled = allSessions.find((s) => s.status === "active") || allSessions[0];
          setSelectedSessionId(activeOrScheduled.id);
        }
      } catch (err: unknown) {
        if (active) console.error("Failed to load OPD sessions:", err);
      }
    }

    loadSessions();
    return () => {
      active = false;
    };
  }, [hospitalId]);

  const loadQueueState = useCallback(async () => {
    if (!selectedSessionId) return;
    try {
      setLoading(true);
      setError(null);
      const state = await fetchSessionQueueState(hospitalId, selectedSessionId);
      setQueueState(state);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load queue state");
    } finally {
      setLoading(false);
    }
  }, [hospitalId, selectedSessionId]);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!selectedSessionId) return;
      try {
        setLoading(true);
        setError(null);
        const state = await fetchSessionQueueState(hospitalId, selectedSessionId);
        if (active) setQueueState(state);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load queue state");
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [hospitalId, selectedSessionId]);

  // Auto-refresh interval (10 seconds)
  useEffect(() => {
    if (!autoRefresh || !selectedSessionId) return;
    const interval = setInterval(() => {
      loadQueueState();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSessionId, loadQueueState]);

  // Live timer for currentlyInConsultation
  useEffect(() => {
    if (!queueState?.currentlyInConsultation?.consultationStartedAt) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [queueState?.currentlyInConsultation]);

  const handleCallNext = async () => {
    try {
      setError(null);
      await callNextPatientClient(hospitalId, selectedSessionId);
      await loadQueueState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to call next patient");
    }
  };

  const handleStartConsultation = async (entry: QueueEntry) => {
    try {
      setError(null);
      await startConsultationClient(hospitalId, entry.id);
      await loadQueueState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start consultation");
    }
  };

  const handleOpenComplete = (entry: QueueEntry) => {
    setCompletingEntry(entry);
    setCompleteOpen(true);
  };

  const handleCompleteSubmit = async (payload: CompleteConsultationPayload) => {
    if (!completingEntry) return;
    await completeConsultationClient(hospitalId, completingEntry.id, payload);
    await loadQueueState();
  };

  const handleSkip = async (entry: QueueEntry) => {
    try {
      setError(null);
      await skipPatientClient(hospitalId, entry.id);
      await loadQueueState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to skip patient");
    }
  };

  const handleRecall = async (entry: QueueEntry) => {
    try {
      setError(null);
      await recallPatientClient(hospitalId, entry.id);
      await loadQueueState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to recall patient");
    }
  };

  const handleSetPriority = async (entry: QueueEntry, priority: QueuePriority) => {
    try {
      setError(null);
      await updateQueuePriorityClient(hospitalId, entry.id, priority);
      await loadQueueState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change priority");
    }
  };

  const handleEmergencySubmit = async (patientId: string, notes?: string) => {
    await createQueueEntryClient(hospitalId, {
      sessionId: selectedSessionId,
      patientId,
      priority: "emergency",
      source: "emergency",
      notes,
    });
    await loadQueueState();
  };

  const currentSession = queueState?.session || sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Top Banner and Session Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Smart OPD Live Queue Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time digital token progression, deterministic priority dispatch, and consultation audit stream
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Session Picker */}
          <select
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[260px]"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.doctorName} ({s.departmentName} — Rm {s.roomNumber})
              </option>
            ))}
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-9 px-3 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRefresh
                ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
            title="Auto-refresh queue telemetry every 10 seconds"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin text-teal-600" : ""}`} />
            {autoRefresh ? "Live Sync (10s)" : "Sync Paused"}
          </button>

          <Button
            size="sm"
            onClick={() => setEmergencyOpen(true)}
            className="h-9 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
          >
            <Siren className="h-4 w-4" />
            Emergency Token
          </Button>

          <Button
            size="sm"
            onClick={handleCallNext}
            disabled={loading || (queueState?.waitingQueue?.length || 0) === 0}
            className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
          >
            <PhoneCall className="h-4 w-4" />
            Call Next Patient
          </Button>
        </div>
      </div>

      {/* Session Details Header Card */}
      {currentSession && (
        <Card className="shadow-xs border-border bg-card/60">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{currentSession.doctorName}</h2>
                  <Badge
                    variant={
                      currentSession.status === "active"
                        ? "default"
                        : currentSession.status === "paused"
                        ? "destructive"
                        : "secondary"
                    }
                    className="capitalize text-[11px]"
                  >
                    {currentSession.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{currentSession.departmentName}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" /> Room {currentSession.roomNumber}
                  </span>
                  <span>•</span>
                  <span>Shift: {currentSession.startTime} – {currentSession.endTime}</span>
                </div>
              </div>
            </div>

            {/* Session Queue Counts */}
            <div className="flex items-center gap-4 text-center">
              <div className="px-3 py-1.5 rounded-lg bg-muted/60 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Running Token</div>
                <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                  {currentSession.currentRunningToken ? `#${currentSession.currentRunningToken}` : "—"}
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-semibold">Waiting In Line</div>
                <div className="text-xl font-bold text-amber-600">
                  {queueState?.stats?.waitingCount ?? currentSession.waitingCount ?? 0}
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Completed</div>
                <div className="text-xl font-bold text-emerald-600">
                  {queueState?.stats?.completedCount ?? currentSession.completedCount ?? 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STAGE 1: Real-time Operational Focus (Currently In Consultation / Currently Called) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active In-Consultation Box */}
        <Card className={`shadow-xs border-2 transition-all ${
          queueState?.currentlyInConsultation
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-border bg-card"
        }`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Currently Consulting In Room
                </span>
              </div>
              {queueState?.currentlyInConsultation && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                  Active Now
                </span>
              )}
            </div>

            {queueState?.currentlyInConsultation ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                      {queueState.currentlyInConsultation.tokenDisplay}
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {queueState.currentlyInConsultation.patientName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {queueState.currentlyInConsultation.patientAge} yrs • {queueState.currentlyInConsultation.patientGender} • Priority: {queueState.currentlyInConsultation.priority}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">Session Duration</span>
                    <span className="text-xl font-mono font-bold text-foreground flex items-center justify-end gap-1">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <Button
                    onClick={() => handleOpenComplete(queueState.currentlyInConsultation!)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Consultation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Stethoscope className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">No patient currently in consultation room.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Summon the next patient when doctor is ready.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Called Box */}
        <Card className={`shadow-xs border-2 transition-all ${
          queueState?.currentlyCalled
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-border bg-card"
        }`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Currently Called (Waiting at Door)
                </span>
              </div>
              {queueState?.currentlyCalled && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                  Summoned
                </span>
              )}
            </div>

            {queueState?.currentlyCalled ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                      {queueState.currentlyCalled.tokenDisplay}
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {queueState.currentlyCalled.patientName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {queueState.currentlyCalled.patientAge} yrs • {queueState.currentlyCalled.patientGender}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">Action Status</span>
                    <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                      Awaiting Intake
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSkip(queueState.currentlyCalled!)}
                    className="border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer text-xs"
                  >
                    <SkipForward className="h-3.5 w-3.5 mr-1" />
                    Skip (No Show)
                  </Button>
                  <Button
                    onClick={() => handleStartConsultation(queueState.currentlyCalled!)}
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-xs cursor-pointer text-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Admit to Consultation Room
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <PhoneCall className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">No patient currently called.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click &apos;Call Next Patient&apos; to summon from waiting list.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* STAGE 2: Waiting Queue Table */}
      <Card className="shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-foreground">
              Waiting Queue Roster ({queueState?.waitingQueue?.length || 0} Patients in Line)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Deterministic Priority: Emergency cases jump to front; FIFO arrival within priority level
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Position</th>
                <th className="py-3 px-4 font-semibold">Token</th>
                <th className="py-3 px-4 font-semibold">Patient Name</th>
                <th className="py-3 px-4 font-semibold">Demographics</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Estimated Wait</th>
                <th className="py-3 px-4 font-semibold text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && !queueState ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : queueState?.waitingQueue?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/50 mb-1" />
                    <p className="font-medium">Waiting queue is empty.</p>
                    <p className="text-xs">All registered patients have been attended to or summoned.</p>
                  </td>
                </tr>
              ) : (
                queueState?.waitingQueue.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      entry.priority === "emergency"
                        ? "bg-rose-500/5 hover:bg-rose-500/10"
                        : entry.position === 1
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-foreground">
                      <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                        #{entry.position}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-foreground">
                      {entry.tokenDisplay}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {entry.patientName}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground capitalize">
                      {entry.patientAge} yrs • {entry.patientGender}
                    </td>
                    <td className="py-3 px-4">
                      {entry.priority === "emergency" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                          EMERGENCY
                        </span>
                      ) : entry.priority === "priority" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                          Priority (Infant/Senior)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-foreground font-semibold">
                      ~{entry.calculatedWaitMinutes} min
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {entry.priority !== "emergency" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPriority(entry, "emergency")}
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 cursor-pointer"
                            title="Elevate to Emergency (Jumps to Position 1)"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                            Emergency
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartConsultation(entry)}
                          className="h-7 px-2 text-xs border-teal-500/40 text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 cursor-pointer"
                          title="Directly admit to doctor room"
                        >
                          Admit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* STAGE 3: Skipped & Completed Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Skipped Patients Box */}
        <Card className="shadow-xs">
          <div className="p-3.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4 text-amber-500" />
              Skipped Patients ({queueState?.skippedQueue?.length || 0})
            </span>
            <span className="text-[11px] text-muted-foreground">Did not appear when called</span>
          </div>
          <CardContent className="p-0">
            {queueState?.skippedQueue?.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                No skipped patients in this session.
              </p>
            ) : (
              <div className="divide-y divide-border max-h-48 overflow-y-auto">
                {queueState?.skippedQueue.map((entry) => (
                  <div key={entry.id} className="p-3 flex items-center justify-between hover:bg-muted/20">
                    <div>
                      <span className="font-mono font-semibold text-xs text-foreground block">
                        {entry.tokenDisplay} — {entry.patientName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {entry.patientAge} yrs • {entry.patientGender}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecall(entry)}
                      className="h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Recall Patient
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Completed Consultations Box */}
        <Card className="shadow-xs">
          <div className="p-3.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Recently Completed Consultations ({queueState?.recentCompleted?.length || 0})
            </span>
            <span className="text-[11px] text-muted-foreground">Audit trail</span>
          </div>
          <CardContent className="p-0">
            {queueState?.recentCompleted?.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                No consultations completed yet in this session.
              </p>
            ) : (
              <div className="divide-y divide-border max-h-48 overflow-y-auto">
                {queueState?.recentCompleted.map((entry) => (
                  <div key={entry.id} className="p-3 flex items-center justify-between hover:bg-muted/20 text-xs">
                    <div>
                      <span className="font-mono font-semibold text-foreground block">
                        {entry.tokenDisplay} — {entry.patientName}
                      </span>
                      <span className="text-[11px] text-muted-foreground italic truncate block max-w-[200px]">
                        {entry.notes || "Routine consultation completed"}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[10px]">
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete Consultation Dialog */}
      <CompleteConsultationDialog
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onSubmit={handleCompleteSubmit}
        entry={completingEntry}
      />

      {/* Emergency Token Dialog */}
      <EmergencyTokenDialog
        hospitalId={hospitalId}
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onSubmit={handleEmergencySubmit}
      />
    </div>
  );
}
