import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { updateSluzbaAction } from "@/lib/actions/sluzba";
import { requireSession } from "@/lib/auth/require-session";
import { sluzbaFrekvenceLabels, sluzbaStavLabels } from "@/lib/labels";
import { getSluzba } from "@/lib/queries/sluzba";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function UpravitSluzbuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getSluzba(id);
  if (!row) notFound();
  const zakaznici = await listZakaznikOptions();

  return (
    <AppShell title="Upravit službu">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={updateSluzbaAction.bind(null, id)} className="space-y-4">
            <FormGrid>
              <FormField label="Název služby" name="nazev_sluzby" required defaultValue={row.nazev_sluzby} />
              <FormSelect
                label="Zákazník"
                name="zakaznik_id"
                required
                defaultValue={row.zakaznik_id}
                options={zakaznici.map((z) => ({ value: z.id, label: z.nazev }))}
              />
              <FormSelect
                label="Frekvence"
                name="frekvence"
                defaultValue={row.frekvence ?? "mesicne"}
                options={Object.entries(sluzbaFrekvenceLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormField
                label="Frekvence ve dnech"
                name="frekvence_dnu"
                type="number"
                defaultValue={row.frekvence_dnu ?? ""}
              />
              <FormField label="Cena za období" name="cena_periody" type="number" step="0.01" defaultValue={row.cena_periody ?? ""} />
              <FormField label="Měna" name="mena" defaultValue={row.mena} />
              <FormField label="Poslední platba" name="posledni_platba" type="date" defaultValue={row.posledni_platba ?? ""} />
              <FormSelect
                label="Stav"
                name="stav"
                defaultValue={row.stav}
                options={Object.entries(sluzbaStavLabels).map(([value, label]) => ({ value, label }))}
              />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Uložit</Button>
              <Button href={`/sluzby/${id}`} variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
