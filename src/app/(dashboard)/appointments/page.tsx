import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function AppointmentsPage() {
  return (
    <ComingSoon
      featureTitle="OPD Appointments"
      section="Patient Management"
      description="Schedule outpatient visits, manage time slot allocations, and streamline patient check-in into active queue sessions."
      plannedCapabilities={[
        "Pre-booked appointment slot allocation per doctor and session",
        "1-click check-in converting appointments into live queue tokens",
        "Status tracking (Booked, Checked In, Completed, Cancelled, No Show)",
        "Daily appointment intake forecasting against walk-in volume",
      ]}
      roadmapStage="Planned for Feature F0.7"
    />
  );
}
