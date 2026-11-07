import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function QueuePage() {
  return (
    <ComingSoon
      featureTitle="Live OPD Queue Monitor"
      section="Queue Operations"
      description="Real-time multi-clinic queue orchestration, waiting room display boards, and clinical room calling consoles."
      plannedCapabilities={[
        "Public waiting hall digital display board with audio chime indicators",
        "Doctor consultation console (Call Next, Begin Consultation, Skip, Complete)",
        "Priority-based queue ordering ensuring emergency patients are seen first",
        "Dynamic per-patient estimated wait time countdowns",
      ]}
      roadmapStage="Planned for Feature F0.8"
    />
  );
}
