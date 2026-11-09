import React from "react";
import { DepartmentView } from "@/features/departments";

export const metadata = {
  title: "Clinical Departments | QueueX",
  description: "Manage outpatient medical departments, consultation rooms, and clinical benchmarks.",
};

export default function DepartmentsPage() {
  return <DepartmentView hospitalId="hosp-vzg-001" />;
}
