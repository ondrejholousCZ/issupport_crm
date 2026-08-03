import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect, FormTextarea } from "@/components/ui/FormField";
import { createPraceAction } from "@/lib/actions/prace";
import { requireSession } from "@/lib/auth/require-session";
import { todayIso } from "@/lib/format";
import { druhCinnostiLabels, stavFakturaceLabels } from "@/lib/labels";
import { listPracovnikOptions } from "@/lib/queries/pracovnik";
import { listProjektOptions } from "@/lib/queries/projekt";

export default async function NovaPracePage({
  searchParams,
}: {
  searchParams: Promise<{ zakaznik?: string; projekt?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [projekty, pracovnici] = await Promise.all([
    listProjektOptions(params.zakaznik),
    listPracovnikOptions(),
  ]);

  return (
    <AppShell title="Nová odvedená práce">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={createPraceAction} className="space-y-4">
            <FormGrid>
              <FormField label="Datum" name="datum" type="date" required defaultValue={todayIso()} />
              <FormSelect
                label="Projekt"
                name="projekt_id"
                required
                defaultValue={params.projekt ?? ""}
                options={[
                  { value: "", label: "— vyberte —" },
                  ...projekty.map((p) => ({ value: p.id, label: p.label })),
                ]}
              />
              <FormSelect
                label="Pracovník"
                name="pracovnik_id"
                required
                options={[
                  { value: "", label: "— vyberte —" },
                  ...pracovnici.map((p) => ({ value: p.id, label: p.label })),
                ]}
              />
              <FormField label="Hodiny" name="hodiny" type="number" min={0} defaultValue={0} />
              <FormField label="Minuty" name="minuty" type="number" min={0} max={59} defaultValue={0} />
              <FormSelect
                label="Druh činnosti"
                name="druh_cinnosti"
                defaultValue="prace"
                options={Object.entries(druhCinnostiLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormSelect
                label="Stav fakturace"
                name="stav_fakturace"
                defaultValue="nefakturovano"
                options={Object.entries(stavFakturaceLabels).map(([value, label]) => ({ value, label }))}
              />
            </FormGrid>
            <FormTextarea label="Popis" name="popis" />
            <div className="flex gap-2 pt-2">
              <Button type="submit">Uložit</Button>
              <Button href="/prace" variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
