import { redirect } from "next/navigation";

export default function HeadCloseLegacyRedirect() {
  redirect("/dashboard/authority-head");
}
