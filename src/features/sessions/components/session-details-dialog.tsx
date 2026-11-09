"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  SerializedOPDSession,
  SerializedOperationalEvent,
  SessionTransitionAction,
} from "../types";
import { fetchOperationalEvents } from "../services/sessions.client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  DoorClosed,
  History,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface SessionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: SerializedOPDSession | null;
  hospitalId: string;
  onTransition: (
    sessionId: string,
    action: SessionTransitionAction,
    options?: { reason?: string }
  ) => Promise<void>;
  isTransitioning: boolean;
}

export function SessionDetailsDialog({
  isOpen,
  onClose,
  session,
  hospitalId,
  onTransition,
  isTransitioning,
}: SessionDetailsDialogProps) {
  const [events, setEvents] = useState<SerializedOperationalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Transition reason state
  const [reasonAction, setReasonAction] = useState<SessionTransitionAction | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const sessionId = session?.id;

  const refreshEvents = useCallback(async () => {
    if (!sessionId) return;
    setLoadingEvents(true);
    try {
      const data = await fetchOperationalEvents(hospitalId, {
        sessionId,
        limit: 20,
      });
      setEvents(data);
      setEventsError(null);
    } catch (err: unknown) {
      setEventsError(
        err instanceof Error ? err.message : "Failed to load audit events"
      );
    } finally {
      setLoadingEvents(false);
    }
  }, [hospitalId, sessionId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!isOpen || !sessionId) return;
      try {
        const data = await fetchOperationalEvents(hospitalId, {
          sessionId,
          limit: 20,
        });
        if (!ignore) {
          setEvents(data);
          setEventsError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setEventsError(
            err instanceof Error ? err.message : "Failed to load audit events"
          );
        }
      } finally {
        if (!ignore) {
          setLoadingEvents(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [isOpen, sessionId, hospitalId]);

  if (!isOpen || !session) return null;

  const handleActionClick = async (action: SessionTransitionAction) => {
    if (action === "pause" || action === "cancel") {
      setReasonAction(action);
      setReasonText("");
      return;
    }

    setActionError(null);
    try {
      await onTransition(session.id, action);
      await refreshEvents();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : `Failed to ${action} session`
      );
    }
  };

  const handleReasonSubmit = async () => {
    if (!reasonAction) return;
    setActionError(null);
    try {
      await onTransition(session.id, reasonAction, {
        reason: reasonText.trim() || undefined,
      });
      setReasonAction(null);
      setReasonText("");
      await refreshEvents();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to ${reasonAction} session`
      );
    }
  };

  const formatTimestamp = (ts?: unknown) => {
    if (!ts) return "Not recorded";
    try {
      const d = new Date(String(ts));
      if (isNaN(d.getTime())) return String(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return String(ts);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1 font-semibold">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active / In Progress
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold">
            Paused / On Break
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-semibold">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="font-semibold">
            Cancelled
          </Badge>
        );
      case "scheduled":
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30 font-semibold">
            Scheduled
          </Badge>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-xl text-card-foreground space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-muted-foreground">
                {session.id}
              </span>
              {getStatusBadge(session.status)}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {session.doctorName}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5 text-primary" />
                {session.departmentName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <DoorClosed className="size-3.5 text-primary" />
                Room {session.roomNumber}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 text-primary" />
                {session.date}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Operational Transition Controls */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Session Operational Actions
            </span>
            <span className="text-xs text-muted-foreground">
              Lifecycle State: <strong className="capitalize">{session.status}</strong>
            </span>
          </div>

          {/* Reason Prompt Dialog (Inline) */}
          {reasonAction && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                Reason for {reasonAction === "pause" ? "pausing" : "cancelling"} this session (optional):
              </p>
              <input
                type="text"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="e.g. Doctor called for emergency surgery, Ward consult"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus:outline-hidden focus:ring-1 focus:ring-ring"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReasonAction(null)}
                  disabled={isTransitioning}
                  className="h-7 text-xs"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  variant={reasonAction === "cancel" ? "destructive" : "default"}
                  onClick={handleReasonSubmit}
                  disabled={isTransitioning}
                  className="h-7 text-xs"
                >
                  {isTransitioning ? "Processing..." : `Confirm ${reasonAction === "pause" ? "Pause" : "Cancel"}`}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!reasonAction && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {session.status === "scheduled" && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleActionClick("start")}
                    disabled={isTransitioning}
                  >
                    <Play className="size-3.5 fill-current" />
                    Start Session
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:bg-destructive/10"
                    onClick={() => handleActionClick("cancel")}
                    disabled={isTransitioning}
                  >
                    <XCircle className="size-3.5" />
                    Cancel Session
                  </Button>
                </>
              )}

              {session.status === "active" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                    onClick={() => handleActionClick("pause")}
                    disabled={isTransitioning}
                  >
                    <Pause className="size-3.5 fill-current" />
                    Pause Session
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
                    onClick={() => handleActionClick("complete")}
                    disabled={isTransitioning}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Complete Session
                  </Button>
                </>
              )}

              {session.status === "paused" && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleActionClick("resume")}
                    disabled={isTransitioning}
                  >
                    <Play className="size-3.5 fill-current" />
                    Resume Session
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
                    onClick={() => handleActionClick("complete")}
                    disabled={isTransitioning}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Complete Session
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:bg-destructive/10"
                    onClick={() => handleActionClick("cancel")}
                    disabled={isTransitioning}
                  >
                    <XCircle className="size-3.5" />
                    Cancel
                  </Button>
                </>
              )}

              {(session.status === "completed" || session.status === "cancelled") && (
                <p className="text-xs text-muted-foreground italic">
                  This session is finalized ({session.status}). State transitions are locked.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timestamps & Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border p-3 space-y-1 bg-card">
            <span className="text-muted-foreground">Scheduled Window</span>
            <p className="font-semibold text-sm">
              {session.startTime} – {session.endTime}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1 bg-card">
            <span className="text-muted-foreground">Actual Started</span>
            <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
              {formatTimestamp(session.startedAt)}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1 bg-card">
            <span className="text-muted-foreground">Actual Completed</span>
            <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">
              {formatTimestamp(session.completedAt)}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1 bg-card">
            <span className="text-muted-foreground">Running Token</span>
            <p className="font-semibold text-sm font-mono text-primary">
              {session.currentRunningToken !== null && session.currentRunningToken !== undefined
                ? `#${session.currentRunningToken}`
                : "None"}
            </p>
          </div>
        </div>

        {/* Token Progression Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border bg-muted/20 p-3">
            <span className="text-xs text-muted-foreground">Tokens Issued</span>
            <div className="text-xl font-bold font-mono mt-0.5 text-foreground">
              {session.totalTokensIssued ?? 0}
            </div>
          </div>
          <div className="rounded-lg border bg-emerald-500/5 p-3">
            <span className="text-xs text-emerald-700 dark:text-emerald-300">Completed Consultations</span>
            <div className="text-xl font-bold font-mono mt-0.5 text-emerald-700 dark:text-emerald-300">
              {session.completedCount ?? 0}
            </div>
          </div>
          <div className="rounded-lg border bg-amber-500/5 p-3">
            <span className="text-xs text-amber-700 dark:text-amber-300">Patients Waiting</span>
            <div className="text-xl font-bold font-mono mt-0.5 text-amber-700 dark:text-amber-300">
              {session.waitingCount ?? 0}
            </div>
          </div>
        </div>

        {/* Operational Audit Events Trail */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Operational Event Trail ({events.length})
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshEvents}
              disabled={loadingEvents}
              className="h-6 px-2 text-xs text-muted-foreground"
            >
              <RefreshCw className={`size-3 mr-1 ${loadingEvents ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {eventsError && (
            <p className="text-xs text-destructive">{eventsError}</p>
          )}

          {loadingEvents ? (
            <p className="text-xs text-muted-foreground py-2 text-center">Loading audit log...</p>
          ) : events.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center italic">
              No operational state changes logged for this session yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-md border bg-muted/30 p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono capitalize">
                      {evt.eventType.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatTimestamp(evt.timestamp)}
                    </span>
                  </div>
                  <p className="text-foreground">{evt.description}</p>
                  {evt.metadata?.reason ? (
                    <p className="text-[11px] text-muted-foreground italic">
                      Reason: &quot;{String(evt.metadata.reason)}&quot;
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
