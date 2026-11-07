"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Activity, X } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const { isMobileOpen, closeMobile } = useSidebar();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        closeMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, closeMobile]);

  if (!isMobileOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      className="fixed inset-0 z-50 lg:hidden"
    >
      {/* Backdrop */}
      <div
        onClick={closeMobile}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800 shrink-0">
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-teal-400 dark:bg-teal-600 dark:text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                QueueX
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                OPD Intelligence
              </span>
            </div>
          </Link>
          <button
            onClick={closeMobile}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <SidebarNav onItemClick={closeMobile} />
      </div>
    </div>
  );
}
