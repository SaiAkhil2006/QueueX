import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function PatientsPage() {
  return (
    <ComingSoon
      featureTitle="Patient Registry & Intake"
      section="Patient Management"
      description="Register outpatient visitors, manage hospital Universal Health IDs (UHID), and look up patient medical history."
      plannedCapabilities={[
        "Quick patient intake with auto-generated UHID tokens",
        "Fast patient search by phone, UHID, or name",
        "Emergency contact and blood group records",
        "Patient OPD visit timeline and past consultation summaries",
      ]}
      roadmapStage="Planned for Feature F0.7"
    />
  );
}
