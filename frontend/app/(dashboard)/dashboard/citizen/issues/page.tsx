import { redirect } from "next/navigation";

export default function CitizenIssuesPage() {
  redirect("/dashboard/citizen?view=my_issues");
}
