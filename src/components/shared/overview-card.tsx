import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OverviewCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trendText?: string;
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
}

export function OverviewCard({
  title,
  value,
  description,
  icon,
  badge,
  trendText,
  trendDirection = "neutral",
  className,
}: OverviewCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-teal-400">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        {badge}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {description && (
          <span className="text-slate-500 dark:text-slate-400 truncate">
            {description}
          </span>
        )}
        {trendText && (
          <span
            className={cn(
              "font-medium shrink-0 ml-2",
              trendDirection === "up" && "text-emerald-600 dark:text-emerald-400",
              trendDirection === "down" && "text-rose-600 dark:text-rose-400",
              trendDirection === "neutral" && "text-slate-500"
            )}
          >
            {trendText}
          </span>
        )}
      </div>

      {/* Demo Telemetry Indicator */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Mock Telemetry</span>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400/80" />
      </div>
    </Card>
  );
}
