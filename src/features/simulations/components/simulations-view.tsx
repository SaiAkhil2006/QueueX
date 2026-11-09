"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  TrendingDown,
  Clock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runSimulation } from "../services/simulations.client";
import type {
  DisruptionScenario,
  SimulationParams,
  SimulationResult,
} from "@/types/simulation";

interface SimulationsViewProps {
  hospitalId: string;
}

export function SimulationsView({ hospitalId }: SimulationsViewProps) {
  const [selectedScenario, setSelectedScenario] = useState<DisruptionScenario>("doctor_late");
  const [delayMinutes, setDelayMinutes] = useState(35);
  const [emergencySurgeCount, setEmergencySurgeCount] = useState(3);
  const [inflowSpikeCount, setInflowSpikeCount] = useState(10);
  const [durationMultiplier, setDurationMultiplier] = useState(2.0);

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let ignore = false;
    const initialRun = async () => {
      try {
        setRunning(true);
        const result = await runSimulation(hospitalId, {
          scenario: "doctor_late",
          delayMinutes: 35,
        });
        if (!ignore) {
          setSimulationResult(result);
        }
      } catch (err) {
        console.error("Initial simulation run failed:", err);
      } finally {
        if (!ignore) setRunning(false);
      }
    };

    initialRun();
    return () => {
      ignore = true;
    };
  }, [hospitalId]);

  const handleRunSimulation = async () => {
    try {
      setRunning(true);
      const params: SimulationParams = {
        scenario: selectedScenario,
        delayMinutes,
        emergencySurgeCount,
        inflowSpikeCount,
        durationMultiplier,
      };
      const result = await runSimulation(hospitalId, params);
      setSimulationResult(result);
    } catch (err) {
      console.error("Simulation run error:", err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Disruption Intelligence & Simulation Sandbox
            </h1>
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <ShieldCheck className="size-3" />
              100% Isolated Projection
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate operational disruptions and stress-test QueueX mitigation heuristics without mutating live clinic records.
          </p>
        </div>
        <Button
          onClick={handleRunSimulation}
          disabled={running}
          className="gap-2 shadow-sm"
        >
          <Play className={`size-4 ${running ? "animate-spin" : ""}`} />
          Run What-If Simulation
        </Button>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { id: "doctor_late", label: "Physician Late", icon: Clock, desc: "Late arrival delay" },
          { id: "emergency_surge", label: "Emergency Surge", icon: AlertTriangle, desc: "Acute trauma cases" },
          { id: "patient_inflow_spike", label: "Walk-in Spike", icon: Users, desc: "Sudden inflow wave" },
          { id: "prolonged_consultations", label: "Complex Cases", icon: Activity, desc: "Extended durations" },
          { id: "doctor_emergency_absence", label: "Sudden Absence", icon: Layers, desc: "Called to surgery" },
        ].map((s) => {
          const isSelected = selectedScenario === s.id;
          const IconComponent = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id as DisruptionScenario)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                  : "border-border bg-card text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                {isSelected && <Badge variant="default" className="text-[10px] h-4 px-1">ACTIVE</Badge>}
              </div>
              <div className="font-semibold text-xs sm:text-sm">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Parameter Adjustment Panel */}
      <Card className="border shadow-xs bg-muted/20">
        <CardContent className="p-4 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Sparkles className="size-4 text-primary" />
            Simulation Parameters:
          </div>

          {selectedScenario === "doctor_late" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Late Arrival Delay:</span>
              <input
                type="range"
                min="15"
                max="75"
                step="5"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="font-mono font-bold text-xs">+{delayMinutes} min</span>
            </div>
          )}

          {selectedScenario === "emergency_surge" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Emergency Influx:</span>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={emergencySurgeCount}
                onChange={(e) => setEmergencySurgeCount(Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="font-mono font-bold text-xs">+{emergencySurgeCount} Patients</span>
            </div>
          )}

          {selectedScenario === "patient_inflow_spike" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Walk-in Wave Size:</span>
              <input
                type="range"
                min="5"
                max="25"
                step="5"
                value={inflowSpikeCount}
                onChange={(e) => setInflowSpikeCount(Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="font-mono font-bold text-xs">+{inflowSpikeCount} Walk-ins</span>
            </div>
          )}

          {selectedScenario === "prolonged_consultations" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Duration Multiplier:</span>
              <input
                type="range"
                min="1.5"
                max="3.0"
                step="0.5"
                value={durationMultiplier}
                onChange={(e) => setDurationMultiplier(Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="font-mono font-bold text-xs">{durationMultiplier}x Standard</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparative Simulation Results */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Scenario Headline */}
          <div className="p-4 rounded-xl border bg-card">
            <h2 className="text-lg font-bold text-foreground">
              {simulationResult.scenarioName}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {simulationResult.description}
            </p>
          </div>

          {/* Impact Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Baseline Card */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Baseline (Normal Flow)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Avg Patient Wait:</span>
                  <span className="font-semibold">{simulationResult.baselineMetrics.avgWaitMinutes} min</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Clinic End Time:</span>
                  <span className="font-semibold">{simulationResult.baselineMetrics.projectedEndTime}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Session Overtime:</span>
                  <span className="font-semibold text-emerald-600">0 min</span>
                </div>
              </CardContent>
            </Card>

            {/* Disrupted (Unmitigated) Card */}
            <Card className="border border-destructive/30 shadow-xs bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  Unmitigated Disruption
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Avg Patient Wait:</span>
                  <span className="font-bold text-destructive">
                    {simulationResult.disruptedMetrics.avgWaitMinutes} min
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Clinic End Time:</span>
                  <span className="font-bold text-destructive">
                    {simulationResult.disruptedMetrics.projectedEndTime}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Session Overtime:</span>
                  <span className="font-bold text-destructive">
                    +{simulationResult.disruptedMetrics.overtimeMinutes} min
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* QueueX Mitigated Card */}
            <Card className="border border-emerald-500/40 shadow-xs bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  QueueX Mitigated Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Avg Patient Wait:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {simulationResult.mitigatedMetrics.avgWaitMinutes} min
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Clinic End Time:</span>
                  <span className="font-bold text-foreground">
                    {simulationResult.mitigatedMetrics.projectedEndTime}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground text-xs">Time Recovered:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingDown className="size-3.5" />
                    Saved {simulationResult.mitigatedMetrics.recoveryMinutes ?? 0} min
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modeled Mitigation Heuristics */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Autonomous Mitigation Strategy Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {simulationResult.mitigationActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Step-by-Step Simulation Timeline */}
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Patient-by-Patient Projected Schedule Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-y text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Token</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Scheduled</th>
                      <th className="py-3 px-4">Disrupted ETA</th>
                      <th className="py-3 px-4">Mitigated ETA</th>
                      <th className="py-3 px-4 text-right">Time Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {simulationResult.timeline.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">{item.tokenDisplay}</td>
                        <td className="py-3 px-4 font-medium">{item.patientName}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={item.priority === "emergency" ? "destructive" : "outline"}
                            className="text-[10px] uppercase"
                          >
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{item.scheduledTime}</td>
                        <td className="py-3 px-4 text-destructive font-semibold">
                          {item.disruptedCallTime} (+{item.disruptedWaitMinutes}m)
                        </td>
                        <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                          {item.mitigatedCallTime} (+{item.mitigatedWaitMinutes}m)
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                          {item.minutesSaved > 0 ? `-${item.minutesSaved} min` : "0 min"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
