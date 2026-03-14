import { redirect } from "next/navigation";

export default function WorkerIssuesLegacyRedirect() {
  redirect("/dashboard/authority-worker");
}
