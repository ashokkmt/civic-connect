import { redirect } from "next/navigation";

export default function AdminSettingsLegacyRedirect() {
  redirect("/dashboard/admin");
}
