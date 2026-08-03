import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { updateProjektAction } from "@/lib/actions/projekt";
import { requireSession } from "@/lib/auth/require-session";
import { projektStavLabels } from "@/lib/labels";
import { getProjekt } from "@/lib/queries/projekt";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function UpravitProjektPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getProjekt(id);
  if (!row) notFound();
  const zakaznici = await listZakaznikOptions();

  return (
    <AppShell title={`Upravit: ${row.nazev_projektu}`}>
      <Card className="max-w-3xl">
        <CardBody>
          <form action={updateProjektAction.bind(null, id)} className="space-y-4">
            <FormGrid>
              <FormField label="Název projektu" name="nazev_projektu" required defaultValue={row.nazev_projektu} />
              <FormSelect
                label="Zákazník"
                name="zakaznik_id"
                required
                defaultValue={row.zakaznik_id}
                options={zakaznici.map((z) => ({ value: z.id, label: z.nazev }))}
              />
              <FormField label="Datum od" name="datum_od" type="date" defaultValue={row.datum_od ?? ""} />
              <FormField label="Datum do" name="datum_do" type="date" defaultValue={row.datum_do ?? ""} />
              <FormField label="Hodinová sazba" name="hodinova_sazba_fak" type="number" step="0.01" defaultValue={row.hodinova_sazba_fak ?? ""} />
              <FormField label="Měna" name="mena" defaultValue={row.mena} />
              <FormSelect
                label="Stav"
                name="stav"
                defaultValue={row.stav}
                options={Object.entries(projektStavLabels).map(([value, label]) => ({ value, label }))}
              />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Uložit</Button>
              <Button href={`/projekty/${id}`} variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
