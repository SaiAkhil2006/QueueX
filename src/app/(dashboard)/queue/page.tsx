import React, { Suspense } from "react";
import { QueueView } from "@/features/queue";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <QueueView hospitalId={DEFAULT_HOSPITAL_ID} />
    </Suspense>
  );
}
