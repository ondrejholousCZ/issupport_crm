import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { ZakaznikForm } from "@/components/zakaznici/ZakaznikForm";
import { createZakaznikAction } from "@/lib/actions/zakaznik";
import { requireSession } from "@/lib/auth/require-session";

export default async function NovyZakaznikPage() {
  if (!(await requireSession())) redirect("/login");

  return (
    <AppShell title="Nový zákazník">
      <Card className="max-w-3xl">
        <CardBody>
          <ZakaznikForm action={createZakaznikAction} cancelHref="/zakaznici" />
        </CardBody>
      </Card>
    </AppShell>
  );
}
