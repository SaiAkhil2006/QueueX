import React from "react";
import { siteConfig } from "@/config/site";
import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-muted/20 py-6 text-sm text-muted-foreground">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="font-semibold text-foreground">{siteConfig.name}</span>
          <span>— {siteConfig.tagline}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built for {siteConfig.event} • Prototype F0.1
        </p>
      </div>
    </footer>
  );
}
