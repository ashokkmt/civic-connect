import { Suspense } from "react";
import { CitizenDashboard } from "@/components/dashboards/citizen/CitizenDashboard";

export default function CitizenDashboardPage() {
  return (
    <Suspense fallback={null}>
      <CitizenDashboard />
    </Suspense>
  );
}
