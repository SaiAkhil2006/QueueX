import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function DepartmentsPage() {
  return (
    <ComingSoon
      featureTitle="Clinical Departments"
      section="Hospital Management"
      description="Configure and monitor hospital outpatient departments, consultation pace baselines, assigned wings, and clinic statuses."
      plannedCapabilities={[
        "Register and configure clinical departments (Cardiology, Pediatrics, etc.)",
        "Set department-specific average consultation duration baselines",
        "Assign consultation rooms, wings, and floor levels",
        "Real-time monitoring of department load and queue health",
      ]}
      roadmapStage="Planned for Feature F0.6"
    />
  );
}
