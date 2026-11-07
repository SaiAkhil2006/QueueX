"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Network,
  Stethoscope,
  CalendarDays,
  Users,
  CalendarCheck,
  Layers,
  Clock,
  TrendingUp,
  Cpu,
  PlayCircle,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "HOSPITAL MANAGEMENT",
    items: [
      {
        title: "Hospital",
        href: "/hospital",
        icon: Building2,
      },
      {
        title: "Departments",
        href: "/departments",
        icon: Network,
      },
      {
        title: "Doctors",
        href: "/doctors",
        icon: Stethoscope,
      },
      {
        title: "Schedules",
        href: "/schedules",
        icon: CalendarDays,
      },
    ],
  },
  {
    title: "PATIENT MANAGEMENT",
    items: [
      {
        title: "Patients",
        href: "/patients",
        icon: Users,
      },
      {
        title: "Appointments",
        href: "/appointments",
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: "QUEUE OPERATIONS",
    items: [
      {
        title: "Live Queue",
        href: "/queue",
        icon: Layers,
        badge: "Live",
      },
      {
        title: "OPD Sessions",
        href: "/sessions",
        icon: Clock,
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        title: "Waiting Time Predictions",
        href: "/predictions",
        icon: TrendingUp,
      },
      {
        title: "Optimization",
        href: "/optimization",
        icon: Cpu,
      },
      {
        title: "Simulations",
        href: "/simulations",
        icon: PlayCircle,
      },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
      },
    ],
  },
];

interface SidebarNavProps {
  onItemClick?: () => void;
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <nav className="flex-1 space-y-6 px-3 py-4 overflow-y-auto">
      {NAVIGATION_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-1">
          {!isCollapsed && (
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </h4>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  title={isCollapsed ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-800 dark:text-teal-400 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-teal-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-400"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300/40">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
