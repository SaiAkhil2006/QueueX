"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Building2,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { Badge } from "@/components/ui/badge";

const ROUTE_TITLES: Record<string, { section: string; title: string }> = {
  "/dashboard": { section: "Overview", title: "Operations Dashboard" },
  "/hospital": { section: "Hospital Management", title: "Hospital Profile & Config" },
  "/departments": { section: "Hospital Management", title: "Clinical Departments" },
  "/doctors": { section: "Hospital Management", title: "Medical Staff & Doctors" },
  "/schedules": { section: "Hospital Management", title: "Doctor Duty Rosters" },
  "/patients": { section: "Patient Management", title: "Patient Registry" },
  "/appointments": { section: "Patient Management", title: "OPD Appointments" },
  "/queue": { section: "Queue Operations", title: "Live OPD Queue Monitor" },
  "/sessions": { section: "Queue Operations", title: "Clinic OPD Sessions" },
  "/predictions": { section: "Intelligence", title: "Wait Time Predictions" },
  "/optimization": { section: "Intelligence", title: "Queue Flow Optimization" },
  "/simulations": { section: "Intelligence", title: "Operational Simulations" },
  "/analytics": { section: "Insights", title: "OPD Analytics & KPIs" },
};

export function Topbar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, toggleMobile } = useSidebar();

  const currentRoute = ROUTE_TITLES[pathname] || {
    section: "Operations",
    title: "QueueX System",
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shrink-0">
      {/* Left: Toggles & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobile}
          aria-label="Open mobile menu"
          className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <span>{currentRoute.section}</span>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-400">
              {currentRoute.title}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
            {currentRoute.title}
          </h1>
        </div>
      </div>

      {/* Right: Hospital Selector & User Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hospital Selector Placeholder */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300">
          <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="font-semibold leading-none truncate max-w-[160px]">
              Vizag Central Hospital
            </span>
            <span className="text-[10px] text-slate-400 leading-none mt-0.5">
              Main Campus • Wing A
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
        </div>

        {/* Live OPD Badge */}
        <Badge
          variant="outline"
          className="hidden xl:inline-flex items-center gap-1.5 border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-normal text-[11px] py-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          OPD Live Desk
        </Badge>

        {/* Notifications Placeholder */}
        <button
          aria-label="View notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600"></span>
          </span>
        </button>

        {/* User Profile / Avatar Placeholder */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-teal-700">
            AR
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
              Dr. Aruna Rao
            </span>
            <span className="text-[10px] text-slate-400 leading-none mt-1">
              Chief Medical Officer
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
