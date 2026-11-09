"use client";

import React, { useState } from "react";
import {
  Clock,
  MapPin,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  BellRing,
  RefreshCw,
  Search,
  ShieldCheck,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPatientTracking } from "../services/tracker.client";
import type { PatientTrackingInfo } from "../services/tracker.server";

export function PatientTrackerView() {
  const [tokenInput, setTokenInput] = useState("GM-001");
  const [trackingInfo, setTrackingInfo] = useState<PatientTrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (tokenToSearch = tokenInput) => {
    if (!tokenToSearch.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPatientTracking(tokenToSearch);
      setTrackingInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Token not found");
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Hospital Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Building className="size-3.5" />
            Visakha Multispeciality Hospital
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            QueueX Live Token Tracker
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time outpatient consultation countdown & live queue position.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="border shadow-xs">
          <CardContent className="p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="Enter Token (e.g. GM-001)"
                  className="pl-9 font-mono font-bold tracking-wider"
                />
              </div>
              <Button type="submit" disabled={loading} className="gap-1.5 shrink-0">
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                Track
              </Button>
            </form>

            {/* Quick Demo Token Chips */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span>Quick Demo:</span>
              {["GM-001", "GM-002", "CARD-001", "PEDS-001"].map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => {
                    setTokenInput(tok);
                    handleLookup(tok);
                  }}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 hover:text-primary font-mono text-[11px] transition-colors"
                >
                  {tok}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}. Please verify your token number or visit the registration counter.</span>
          </div>
        )}

        {/* Live Token Status Board */}
        {trackingInfo && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Approaching Turn Banner Alert */}
            {trackingInfo.notifyApproach && (
              <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
                <BellRing className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 animate-bounce shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Your Turn Is Approaching!</h4>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    Only {trackingInfo.patientsAheadCount} patient(s) ahead of you. Please proceed to the{" "}
                    <span className="font-semibold underline">
                      Room {trackingInfo.roomNumber} ({trackingInfo.floor})
                    </span>{" "}
                    waiting lobby.
                  </p>
                </div>
              </div>
            )}

            {/* Emergency Delay Banner */}
            {trackingInfo.delayNotice && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 flex items-start gap-2.5 text-xs">
                <AlertCircle className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <span>{trackingInfo.delayNotice}</span>
              </div>
            )}

            {/* Main Token Digital Board Card */}
            <Card className="border-2 border-primary/30 shadow-lg overflow-hidden bg-card">
              <div className="bg-primary/10 border-b p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Digital OPD Pass
                  </div>
                  <div className="font-medium text-xs text-foreground">
                    {trackingInfo.patientName} • {trackingInfo.uhidMasked}
                  </div>
                </div>
                <Badge
                  variant={
                    trackingInfo.status === "in_consultation"
                      ? "default"
                      : trackingInfo.status === "called"
                      ? "destructive"
                      : "secondary"
                  }
                  className="font-bold uppercase text-xs"
                >
                  {trackingInfo.status.replace("_", " ")}
                </Badge>
              </div>

              <CardContent className="p-6 text-center space-y-6">
                {/* Big Token Number */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">
                    Your Assigned Token
                  </div>
                  <div className="text-5xl font-extrabold font-mono tracking-tight text-primary">
                    {trackingInfo.tokenDisplay}
                  </div>
                </div>

                {/* Live Position & Countdown */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/40 rounded-2xl border">
                  <div className="space-y-0.5">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="size-3.5" />
                      Estimated Wait
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {trackingInfo.status === "in_consultation"
                        ? "Inside"
                        : trackingInfo.status === "called"
                        ? "Proceed"
                        : `~${trackingInfo.estimatedWaitMinutes} min`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Call Time: {trackingInfo.estimatedCallTime}
                    </div>
                  </div>

                  <div className="space-y-0.5 border-l">
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      Queue Position
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {trackingInfo.status === "waiting"
                        ? `#${trackingInfo.positionInQueue}`
                        : "Ready"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {trackingInfo.patientsAheadCount} ahead in line
                    </div>
                  </div>
                </div>

                {/* Consultation Details */}
                <div className="text-left space-y-2.5 pt-2 border-t text-sm">
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Stethoscope className="size-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold">{trackingInfo.doctorName}</span>
                      <span className="text-xs text-muted-foreground block">
                        {trackingInfo.departmentName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-foreground">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold">Room {trackingInfo.roomNumber}</span>
                      <span className="text-xs text-muted-foreground block">
                        {trackingInfo.floor}, {trackingInfo.wing}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto Refresh Footer */}
                <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3 text-emerald-500" />
                    Privacy Protected Pass
                  </span>
                  <span>Updated at {trackingInfo.lastUpdated}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
