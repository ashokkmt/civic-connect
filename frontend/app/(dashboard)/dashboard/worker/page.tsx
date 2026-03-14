import { redirect } from "next/navigation";

export default function WorkerDashboardLegacyRedirect() {
  redirect("/dashboard/authority-worker");
}
