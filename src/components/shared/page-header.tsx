import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pb-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">{actions}</div>}
    </div>
  );
}
