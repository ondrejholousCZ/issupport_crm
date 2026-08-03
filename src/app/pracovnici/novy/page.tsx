import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { createPracovnikAction } from "@/lib/actions/pracovnik";
import { requireSession } from "@/lib/auth/require-session";
import { pracovnikTypLabels } from "@/lib/labels";

export default async function NovyPracovnikPage() {
  if (!(await requireSession())) redirect("/login");

  return (
    <AppShell title="Nový pracovník">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={createPracovnikAction} className="space-y-4">
            <FormGrid>
              <FormField label="Jméno" name="jmeno" required />
              <FormField label="Příjmení" name="prijmeni" required />
              <FormField label="E-mail" name="email" type="email" />
              <FormSelect
                label="Typ"
                name="typ"
                defaultValue="zamestnanec"
                options={Object.entries(pracovnikTypLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormField label="Náklad na hodinu" name="naklad_na_hodinu" type="number" step="0.01" />
              <FormField label="Měna" name="mena" defaultValue="CZK" />
              <FormField label="Sazba platná od" name="sazba_platna_od" type="date" />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Uložit</Button>
              <Button href="/pracovnici" variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
