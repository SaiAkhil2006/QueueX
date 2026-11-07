import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  featureTitle: string;
  section: string;
  description: string;
  plannedCapabilities: string[];
  roadmapStage?: string;
}

export function ComingSoon({
  featureTitle,
  section,
  description,
  plannedCapabilities,
  roadmapStage = "Upcoming Roadmap Feature",
}: ComingSoonProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Navigation Return */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Operations Dashboard</span>
        </Link>
      </div>

      <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="secondary"
              className="bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60"
            >
              {section}
            </Badge>
            <Badge variant="outline" className="text-slate-500 text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {roadmapStage}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {featureTitle}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Planned Capabilities */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Planned Capabilities for QueueX</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plannedCapabilities.map((capability, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            <span>GDG Vizag Local2Global Hackathon Prototype</span>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs"
              )}
            >
              Return to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
