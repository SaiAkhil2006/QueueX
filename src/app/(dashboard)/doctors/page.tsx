import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function DoctorsPage() {
  return (
    <ComingSoon
      featureTitle="Medical Staff & Doctors"
      section="Hospital Management"
      description="Manage doctor credentials, medical specializations, room assignments, consultation duration pacing, and live availability."
      plannedCapabilities={[
        "Doctor profile directory with qualifications and specializations",
        "Assigned consultation room mapping across outpatient wings",
        "Individual consultation pacing parameters for waiting time prediction",
        "Live availability tracking (Available, Busy, On Break, Off Duty)",
      ]}
      roadmapStage="Planned for Feature F0.6"
    />
  );
}
