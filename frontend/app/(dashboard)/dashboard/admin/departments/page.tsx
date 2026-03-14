import { redirect } from "next/navigation";

export default function AdminDepartmentsLegacyRedirect() {
  redirect("/dashboard/admin");
}
