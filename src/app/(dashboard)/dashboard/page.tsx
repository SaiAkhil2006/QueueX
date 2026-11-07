import React from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  Stethoscope,
  Activity,
  Layers,
  ArrowRight,
  Server,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { OverviewCard } from "@/components/shared/overview-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export default function DashboardPage() {
  const isFirebaseLive = isFirebaseAdminConfigured();

  // Mock department activity telemetry
  const departments = [
    {
      name: "Cardiology",
      code: "CARD",
      doctorsOnDuty: 4,
      rooms: "201-204",
      waiting: 16,
      currentToken: 14,
      estWait: "28 min",
      status: "Moderate",
      statusColor: "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300",
    },
    {
      name: "Pediatrics",
      code: "PED",
      doctorsOnDuty: 3,
      rooms: "101-103",
      waiting: 9,
      currentToken: 21,
      estWait: "15 min",
      status: "Nominal",
      statusColor: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    {
      name: "General Medicine",
      code: "GM",
      doctorsOnDuty: 5,
      rooms: "105-109",
      waiting: 24,
      currentToken: 38,
      estWait: "22 min",
      status: "Nominal",
      statusColor: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    {
      name: "Orthopedics",
      code: "ORTH",
      doctorsOnDuty: 3,
      rooms: "301-303",
      waiting: 14,
      currentToken: 12,
      estWait: "32 min",
      status: "Attention",
      statusColor: "text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300",
    },
    {
      name: "Dermatology",
      code: "DERM",
      doctorsOnDuty: 2,
      rooms: "207-208",
      waiting: 5,
      currentToken: 9,
      estWait: "12 min",
      status: "Nominal",
      statusColor: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    {
      name: "ENT",
      code: "ENT",
      doctorsOnDuty: 2,
      rooms: "211-212",
      waiting: 4,
      currentToken: 11,
      estWait: "10 min",
      status: "Nominal",
      statusColor: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
  ];

  // Mock live queue entries preview
  const liveQueuePreview = [
    {
      token: "EMRG-001",
      patient: "S. Venkat (64M)",
      department: "Cardiology",
      doctor: "Dr. K. Srinivas",
      priority: "emergency",
      status: "in_consultation",
      wait: "3 min",
    },
    {
      token: "CARD-014",
      patient: "V. Lakshmi (48F)",
      department: "Cardiology",
      doctor: "Dr. K. Srinivas",
      priority: "normal",
      status: "called",
      wait: "18 min",
    },
    {
      token: "GM-039",
      patient: "M. Rajesh (32M)",
      department: "General Medicine",
      doctor: "Dr. R. Verma",
      priority: "normal",
      status: "waiting",
      wait: "21 min",
    },
    {
      token: "PED-022",
      patient: "Baby Aarav (2M)",
      department: "Pediatrics",
      doctor: "Dr. Deepa Rao",
      priority: "priority",
      status: "waiting",
      wait: "12 min",
    },
    {
      token: "ORTH-013",
      patient: "T. Narayana (58M)",
      department: "Orthopedics",
      doctor: "Dr. Sandeep K.",
      priority: "normal",
      status: "waiting",
      wait: "31 min",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Hospital Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                Vizag Central Hospital • Main OPD Wing
              </Badge>
              <Badge
                variant="outline"
                className="text-[11px] border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                Morning Session (08:30 – 13:30)
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hospital OPD Operations Command
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Real-time patient throughput tracking, department bottleneck identification, and intelligent outpatient queue orchestration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            <Link
              href="/queue"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500 font-semibold shadow-xs"
              )}
            >
              <Layers className="mr-1.5 h-4 w-4" />
              Open Live Queue
            </Link>
            <Link
              href="/sessions"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
            >
              OPD Sessions
            </Link>
          </div>
        </div>

        {/* Date & Demo Data Notice */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <span>Saturday, November 7, 2026 • Live Telemetry Mode</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40">
            <AlertTriangle className="h-3 w-3" />
            <span>Demonstration Telemetry • Synthetic Data Preview</span>
          </div>
        </div>
      </div>

      {/* Overview Cards (4 Required Cards) */}
      <section aria-labelledby="overview-metrics-title">
        <h3 id="overview-metrics-title" className="sr-only">
          OPD Overview Metrics
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="Patients Today"
            value="284"
            description="184 completed • 28 in consult"
            icon={<Users className="h-4 w-4" />}
            trendText="+14% vs avg"
            trendDirection="up"
          />
          <OverviewCard
            title="Currently Waiting"
            value="72"
            description="Across 6 clinical departments"
            icon={<Clock className="h-4 w-4" />}
            trendText="Peak: Cardiology"
            trendDirection="neutral"
            badge={
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                Active
              </Badge>
            }
          />
          <OverviewCard
            title="Active Doctors"
            value="18 / 20"
            description="90% clinic roster fulfillment"
            icon={<Stethoscope className="h-4 w-4" />}
            trendText="2 on leave"
            trendDirection="neutral"
            badge={
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Staffed
              </Badge>
            }
          />
          <OverviewCard
            title="Average Waiting Time"
            value="22.4 min"
            description="Target threshold: < 30 min"
            icon={<Activity className="h-4 w-4" />}
            trendText="-4.2 min vs benchmark"
            trendDirection="up"
            badge={
              <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                Optimal
              </Badge>
            }
          />
        </div>
      </section>

      {/* Department Activity & Queue Snapshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* OPD Department Activity */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Department Activity Snapshot
                </CardTitle>
                <CardDescription className="text-xs">
                  Active outpatient clinic status across hospital wings.
                </CardDescription>
              </div>
              <Link
                href="/departments"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                      <th className="pb-2.5 font-medium">Department</th>
                      <th className="pb-2.5 font-medium">Doctors</th>
                      <th className="pb-2.5 font-medium">Rooms</th>
                      <th className="pb-2.5 font-medium text-center">Waiting</th>
                      <th className="pb-2.5 font-medium text-center">Current Token</th>
                      <th className="pb-2.5 font-medium text-center">Est. Wait</th>
                      <th className="pb-2.5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {departments.map((dept) => (
                      <tr key={dept.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
                          <div>{dept.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{dept.code}</div>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {dept.doctorsOnDuty} on duty
                        </td>
                        <td className="py-3 font-mono text-slate-500">
                          {dept.rooms}
                        </td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white text-center">
                          {dept.waiting}
                        </td>
                        <td className="py-3 font-mono font-semibold text-teal-600 dark:text-teal-400 text-center">
                          #{dept.currentToken}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300 text-center">
                          {dept.estWait}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={cn(
                              "inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border border-transparent",
                              dept.statusColor
                            )}
                          >
                            {dept.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Queue Overview Preview */}
        <div className="space-y-4">
          <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Live Queue Preview
                </CardTitle>
                <CardDescription className="text-xs">
                  Active patient token progression.
                </CardDescription>
              </div>
              <Link
                href="/queue"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
              >
                <span>Full Queue</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {liveQueuePreview.map((item) => (
                  <div key={item.token} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {item.token}
                        </span>
                        {item.priority === "emergency" && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                            Emergency
                          </Badge>
                        )}
                        {item.priority === "priority" && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700">
                            Priority
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize font-medium",
                          item.status === "in_consultation" && "border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950/50",
                          item.status === "called" && "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/50",
                          item.status === "waiting" && "text-slate-500"
                        )}
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.patient}</span>
                      <span className="text-[11px] font-mono">Wait: {item.wait}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 truncate">
                      {item.department} • {item.doctor}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Infrastructure Status */}
      <section aria-labelledby="system-status-title">
        <h3 id="system-status-title" className="sr-only">
          System Infrastructure Status
        </h3>
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <CardTitle className="text-base font-bold">
                  QueueX Platform Infrastructure State
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Stage F0.5
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Live status report of backend services and database layers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Core App */}
              <div className="rounded-lg border border-slate-200/70 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Next.js App Router</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500">Turbopack compilation active</p>
                <Badge variant="secondary" className="text-[9px] bg-emerald-50 text-emerald-700">
                  Online
                </Badge>
              </div>

              {/* Security Rules */}
              <div className="rounded-lg border border-slate-200/70 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Firestore Rules</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500">Client direct deny locked</p>
                <Badge variant="secondary" className="text-[9px] bg-emerald-50 text-emerald-700">
                  Active (F0.3)
                </Badge>
              </div>

              {/* Type System */}
              <div className="rounded-lg border border-slate-200/70 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Zod Validation Layer</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500">12 domain entities validated</p>
                <Badge variant="secondary" className="text-[9px] bg-emerald-50 text-emerald-700">
                  Consolidated (F0.4)
                </Badge>
              </div>

              {/* Firebase Admin Connectivity */}
              <div className="rounded-lg border border-slate-200/70 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Firebase Backend</span>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isFirebaseLive ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isFirebaseLive
                    ? "Admin SDK connected"
                    : "Credentials pending in .env.local"}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px]",
                    isFirebaseLive
                      ? "text-emerald-700 border-emerald-300"
                      : "text-amber-700 border-amber-300 bg-amber-50"
                  )}
                >
                  {isFirebaseLive ? "Connected" : "Unconfigured (Demo Mode)"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
