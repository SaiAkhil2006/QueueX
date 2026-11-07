"use client";

import React from "react";
import { SidebarProvider } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Topbar } from "./topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        {/* Desktop Persistent Sidebar */}
        <Sidebar />

        {/* Mobile Navigation Drawer */}
        <MobileNav />

        {/* Content Shell */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Navigation */}
          <Topbar />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
