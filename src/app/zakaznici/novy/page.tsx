import { redirect } from "next/navigation";

export default function NovyZakaznikPage() {
  redirect("/zakaznici?nova=1");
}
