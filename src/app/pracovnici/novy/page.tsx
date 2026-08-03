import { redirect } from "next/navigation";

export default function NovyPracovnikPage() {
  redirect("/pracovnici?nova=1");
}
