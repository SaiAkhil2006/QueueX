import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function HospitalPage() {
  return (
    <ComingSoon
      featureTitle="Hospital Profile & Configuration"
      section="Hospital Management"
      description="Manage hospital institutional details, OPD operating hours, clinic wings, emergency escalation thresholds, and facility parameters."
      plannedCapabilities={[
        "Configure hospital metadata (name, address, timezone, contact info)",
        "Define default OPD shift schedules (morning and evening hours)",
        "Set emergency wait time escalation thresholds",
        "Manage clinical wings, consultation room numbers, and capacity limits",
      ]}
      roadmapStage="Planned for Feature F0.6"
    />
  );
}
