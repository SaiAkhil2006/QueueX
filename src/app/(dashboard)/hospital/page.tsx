import React from "react";
import { HospitalView } from "@/features/hospital";

export const metadata = {
  title: "Hospital Configuration | QueueX",
  description: "Manage institutional configuration and OPD operational shift hours.",
};

export default function HospitalPage() {
  return <HospitalView hospitalId="hosp-vzg-001" />;
}
