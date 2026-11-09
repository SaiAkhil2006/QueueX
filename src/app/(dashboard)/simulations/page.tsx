import React, { Suspense } from "react";
import { SimulationsView } from "@/features/simulations";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

export default function SimulationsPage() {
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
      <SimulationsView hospitalId={DEFAULT_HOSPITAL_ID} />
    </Suspense>
  );
}
