import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function SchedulesPage() {
  return (
    <ComingSoon
      featureTitle="Doctor Duty Rosters & Schedules"
      section="Hospital Management"
      description="Define weekly clinic duty schedules, working shifts, maximum patient intake caps, and scheduled rest periods."
      plannedCapabilities={[
        "Weekly recurring shift templates across departments",
        "Configurable morning and evening OPD consultation hours",
        "Scheduled doctor break periods and clinic pauses",
        "Max patient capacity limits per doctor session",
      ]}
      roadmapStage="Planned for Feature F0.6"
    />
  );
}
