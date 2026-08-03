import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { createProjektAction } from "@/lib/actions/projekt";
import { requireSession } from "@/lib/auth/require-session";
import { projektStavLabels } from "@/lib/labels";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function NovyProjektPage({
  searchParams,
}: {
  searchParams: Promise<{ zakaznik?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const zakaznici = await listZakaznikOptions();

  return (
    <AppShell title="Nový projekt">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={createProjektAction} className="space-y-4">
            <FormGrid>
              <FormField label="Název projektu" name="nazev_projektu" required />
              <FormField
                label="Zkrácený název (zakázka)"
                name="zakazka"
                placeholder="např. PGRLF, Gerkin"
                hint="Krátký kód pro sloupec Zakázka ve výkazu práce (Excel)"
              />
              <FormSelect
                label="Zákazník"
                name="zakaznik_id"
                required
                defaultValue={params.zakaznik ?? ""}
                options={[
                  { value: "", label: "— vyberte —" },
                  ...zakaznici.map((z) => ({ value: z.id, label: z.nazev })),
                ]}
              />
              <FormField label="Datum od" name="datum_od" type="date" />
              <FormField label="Datum do" name="datum_do" type="date" />
              <FormField label="Hodinová sazba fakturace" name="hodinova_sazba_fak" type="number" step="0.01" />
              <FormField label="Měna" name="mena" defaultValue="CZK" />
              <FormSelect
                label="Stav"
                name="stav"
                defaultValue="aktivni"
                options={Object.entries(projektStavLabels).map(([value, label]) => ({ value, label }))}
              />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <SubmitButton>Uložit</SubmitButton>
              <Button href="/projekty" variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
