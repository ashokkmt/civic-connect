import { redirect } from "next/navigation";

export default function WorkerSettingsLegacyRedirect() {
  redirect("/dashboard/authority-worker");
}
