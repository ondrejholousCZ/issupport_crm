import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { createSluzbaAction } from "@/lib/actions/sluzba";
import { requireSession } from "@/lib/auth/require-session";
import { sluzbaFrekvenceLabels, sluzbaStavLabels } from "@/lib/labels";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function NovaSluzbaPage({
  searchParams,
}: {
  searchParams: Promise<{ zakaznik?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const zakaznici = await listZakaznikOptions();

  return (
    <AppShell title="Nová služba">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={createSluzbaAction} className="space-y-4">
            <FormGrid>
              <FormField label="Název služby" name="nazev_sluzby" required />
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
              <FormSelect
                label="Frekvence"
                name="frekvence"
                defaultValue="mesicne"
                options={Object.entries(sluzbaFrekvenceLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormField
                label="Frekvence ve dnech"
                name="frekvence_dnu"
                type="number"
                hint="Vyplňte pouze u frekvence „Vlastní“"
              />
              <FormField label="Cena za období" name="cena_periody" type="number" step="0.01" />
              <FormField label="Měna" name="mena" defaultValue="CZK" />
              <FormField label="Poslední platba" name="posledni_platba" type="date" />
              <FormSelect
                label="Stav"
                name="stav"
                defaultValue="aktivni"
                options={Object.entries(sluzbaStavLabels).map(([value, label]) => ({ value, label }))}
              />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <SubmitButton>Uložit</SubmitButton>
              <Button href="/sluzby" variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
