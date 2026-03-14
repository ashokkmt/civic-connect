import { redirect } from "next/navigation";

export default function HeadSettingsLegacyRedirect() {
  redirect("/dashboard/authority-head");
}
