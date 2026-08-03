import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card, CardBody } from "@/components/ui/Card";
import { CasInput } from "@/components/prace/CasInput";
import { FormField, FormGrid, FormSelect, FormTextarea } from "@/components/ui/FormField";
import { updatePraceAction } from "@/lib/actions/prace";
import { requireSession } from "@/lib/auth/require-session";
import { formatCasInput } from "@/lib/cas";
import { druhCinnostiLabels, stavFakturaceLabels } from "@/lib/labels";
import { listPracovnikOptions } from "@/lib/queries/pracovnik";
import { listProjektOptions } from "@/lib/queries/projekt";
import { getPrace } from "@/lib/queries/prace";

export default async function UpravitPracePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getPrace(id);
  if (!row) notFound();

  const [projekty, pracovnici] = await Promise.all([
    listProjektOptions(row.zakaznik_id),
    listPracovnikOptions(),
  ]);

  return (
    <AppShell title="Upravit odvedenou práci">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={updatePraceAction.bind(null, id)} className="space-y-4">
            <input type="hidden" name="zakaznik_id" value={row.zakaznik_id} />
            <FormGrid>
              <FormField label="Datum" name="datum" type="date" required defaultValue={row.datum} />
              <FormSelect
                label="Projekt"
                name="projekt_id"
                required
                defaultValue={row.projekt_id}
                options={projekty.map((p) => ({ value: p.id, label: p.label }))}
              />
              <FormSelect
                label="Pracovník"
                name="pracovnik_id"
                required
                defaultValue={row.pracovnik_id}
                options={pracovnici.map((p) => ({ value: p.id, label: p.label }))}
              />
              <FormSelect
                label="Druh činnosti"
                name="druh_cinnosti"
                defaultValue={row.druh_cinnosti ?? "prace"}
                options={Object.entries(druhCinnostiLabels).map(([value, label]) => ({ value, label }))}
              />
              <CasInput defaultValue={formatCasInput(row.hodiny, row.minuty)} />
              <FormSelect
                label="Stav fakturace"
                name="stav_fakturace"
                defaultValue={row.stav_fakturace}
                options={Object.entries(stavFakturaceLabels).map(([value, label]) => ({ value, label }))}
              />
            </FormGrid>
            <FormTextarea label="Popis" name="popis" defaultValue={row.popis ?? ""} />
            <div className="flex gap-2 pt-2">
              <SubmitButton>Uložit</SubmitButton>
              <Button href={`/prace/${id}`} variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
