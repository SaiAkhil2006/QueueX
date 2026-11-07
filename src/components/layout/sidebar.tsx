"use client";

import React from "react";
import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-30",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800 shrink-0">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 transition-all outline-none",
            isCollapsed && "mx-auto justify-center"
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-teal-400 dark:bg-teal-600 dark:text-white shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                QueueX
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                OPD Intelligence
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <SidebarNav />

      {/* Footer & Collapse Toggle */}
      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800 shrink-0 space-y-2">
        {!isCollapsed && (
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="truncate">GDG Vizag Local2Global</span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">
              OPD Operations Platform v0.5
            </p>
          </div>
        )}

        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
