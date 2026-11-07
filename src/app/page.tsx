import React from "react";
import {
  Activity,
  Users,
  Clock,
  Stethoscope,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Database,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="flex flex-col items-start gap-4 border-b border-border/50 pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300">
            Hackathon Prototype • Stage F0.1
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {siteConfig.event}
          </Badge>
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            Hospital Outpatient Department Queue Intelligence
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {siteConfig.description} Purpose-built to eliminate crowding, forecast wait times, identify operational bottlenecks, and coordinate clinic workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="#operational-snapshot"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-teal-600 hover:bg-teal-700 text-white shadow-sm h-9 px-4"
            )}
          >
            View OPD Shell
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </a>
          <a
            href="#system-architecture"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Repository Architecture
          </a>
        </div>
      </section>

      {/* Operational Snapshot Placeholder */}
      <section id="operational-snapshot" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              OPD Operational Shell Placeholder
            </h2>
            <p className="text-sm text-muted-foreground">
              Mock telemetry illustrating live outpatient department monitoring layout.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-background text-xs py-1">
              Live Feed: Active
            </Badge>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Registered Today"
            value="142"
            description="Across 6 active outpatient clinics"
            icon={<Users className="h-4 w-4" />}
            badge={
              <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                +12% vs avg
              </Badge>
            }
          />
          <StatCard
            title="Est. Median Wait Time"
            value="24 min"
            description="Service target: < 30 minutes"
            icon={<Clock className="h-4 w-4" />}
            badge={
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Nominal
              </Badge>
            }
          />
          <StatCard
            title="Active Consultation Rooms"
            value="18 / 20"
            description="90% doctor roster fulfillment"
            icon={<Stethoscope className="h-4 w-4" />}
            badge={
              <Badge variant="secondary" className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                Staffed
              </Badge>
            }
          />
          <StatCard
            title="Bottleneck Index"
            value="Low Risk"
            description="Orthopedics clinic queue monitored"
            icon={<AlertTriangle className="h-4 w-4" />}
            badge={
              <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                Stable
              </Badge>
            }
          />
        </div>

        {/* Clinic Queue Status Overview (Placeholder) */}
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Department Queue Status</CardTitle>
                <CardDescription>
                  Preview of clinical queue tracking across hospital wings.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Demo State
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {[
                { name: "General Medicine", code: "GM-01", queue: 28, wait: "22 min", status: "Optimal" },
                { name: "Pediatrics", code: "PED-02", queue: 19, wait: "18 min", status: "Optimal" },
                { name: "Cardiology", code: "CARD-01", queue: 14, wait: "30 min", status: "Moderate" },
                { name: "Orthopedics", code: "ORTH-03", queue: 26, wait: "35 min", status: "Monitored" },
              ].map((dept) => (
                <div key={dept.code} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{dept.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{dept.code}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <div className="font-semibold">{dept.queue}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Waiting</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{dept.wait}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Est. Wait</div>
                    </div>
                    <Badge variant="outline" className="text-xs font-normal">
                      {dept.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* System Architecture and Roadmap Section */}
      <section id="system-architecture" className="space-y-6 pt-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Modular System Architecture
          </h2>
          <p className="text-sm text-muted-foreground">
            Architecture initialized under feature F0.1 ready for incremental feature delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <CheckCircle2 className="h-4 w-4" />
                <CardTitle className="text-base">F0.1 Initialization</CardTitle>
              </div>
              <CardDescription>Core repository & tooling</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Next.js App Router & TypeScript (Strict)
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Tailwind CSS & shadcn/ui components
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Vitest suite & Next Route Handlers
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Modular directory hierarchy
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 opacity-80">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                <CardTitle className="text-base">Roadmap: Data & Auth</CardTitle>
              </div>
              <CardDescription>Upcoming features (F0.2+)</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Firestore schema & security rules
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Firebase Admin SDK integration
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Hospital profile & clinic setup
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Role-based staff authentication
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 opacity-80">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="h-4 w-4" />
                <CardTitle className="text-base">Roadmap: Intelligence</CardTitle>
              </div>
              <CardDescription>Queue optimization & predictive engine</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Real-time queue tracking & ticketing
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Wait time prediction algorithms
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Bottleneck detection & re-routing
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                Operational intelligence analytics
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
