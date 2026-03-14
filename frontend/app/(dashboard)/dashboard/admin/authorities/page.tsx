import { redirect } from "next/navigation";

export default function AdminAuthoritiesLegacyRedirect() {
  redirect("/dashboard/admin");
}
