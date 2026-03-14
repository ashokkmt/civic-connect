import { redirect } from "next/navigation";

export default function HeadPendingLegacyRedirect() {
  redirect("/dashboard/authority-head");
}
