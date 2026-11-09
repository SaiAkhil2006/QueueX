import React, { Suspense } from "react";
import { PatientTrackerView } from "@/features/tracker";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Patient Live Queue Tracker | QueueX",
  description: "Track your consultation token number, estimated wait time, and queue position live.",
};

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8 flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full max-w-md" />
        </div>
      }
    >
      <PatientTrackerView />
    </Suspense>
  );
}
