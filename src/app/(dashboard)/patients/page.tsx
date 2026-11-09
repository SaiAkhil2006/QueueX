import React, { Suspense } from "react";
import { PatientView } from "@/features/patients";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <PatientView hospitalId={DEFAULT_HOSPITAL_ID} />
    </Suspense>
  );
}
