import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect, FormTextarea } from "@/components/ui/FormField";
import { createZakaznikAction } from "@/lib/actions/zakaznik";
import { requireSession } from "@/lib/auth/require-session";
import { zakaznikStavLabels } from "@/lib/labels";

export default async function NovyZakaznikPage() {
  if (!(await requireSession())) redirect("/login");

  return (
    <AppShell title="Nový zákazník">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={createZakaznikAction} className="space-y-4">
            <FormGrid>
              <FormField label="Název" name="nazev" required />
              <FormField label="IČO" name="ico" />
              <FormField label="IČ DPH" name="ic_dph" />
              <FormSelect
                label="Stav"
                name="stav"
                defaultValue="aktivni"
                options={Object.entries(zakaznikStavLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormField label="Kontaktní e-mail" name="kontaktni_email" type="email" />
              <FormField label="Telefon" name="kontaktni_telefon" />
              <FormField label="Ulice" name="fakturacni_ulice" />
              <FormField label="Město" name="fakturacni_mesto" />
              <FormField label="PSČ" name="fakturacni_psc" />
            </FormGrid>
            <FormTextarea label="Postup fakturace" name="postup_fakturace" />
            <div className="flex gap-2 pt-2">
              <Button type="submit">Uložit</Button>
              <Button href="/zakaznici" variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
