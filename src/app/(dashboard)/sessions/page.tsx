import React, { Suspense } from "react";
import { SessionView } from "@/features/sessions/components/session-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <SessionView />
    </Suspense>
  );
}
