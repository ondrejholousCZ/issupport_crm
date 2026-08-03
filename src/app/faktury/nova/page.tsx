import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { createFakturaAction } from "@/lib/actions/faktura";
import { requireSession } from "@/lib/auth/require-session";
import { todayIso } from "@/lib/format";
import { fakturaStavLabels, fakturaTypLabels } from "@/lib/labels";
import { listProjektOptions } from "@/lib/queries/projekt";
import { listSluzbaOptions } from "@/lib/queries/sluzba";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function NovaFakturaPage({
  searchParams,
}: {
  searchParams: Promise<{ zakaznik?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [zakaznici, projekty, sluzby] = await Promise.all([
    listZakaznikOptions(),
    listProjektOptions(params.zakaznik),
    listSluzbaOptions(params.zakaznik),
  ]);

  return (
    <AppShell title="Nová faktura">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={createFakturaAction} className="space-y-4">
            <FormGrid>
              <FormField label="Číslo faktury" name="cislo_faktury" />
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
                label="Projekt"
                name="projekt_id"
                options={[{ value: "", label: "—" }, ...projekty.map((p) => ({ value: p.id, label: p.label }))]}
              />
              <FormSelect
                label="Služba"
                name="sluzba_id"
                options={[{ value: "", label: "—" }, ...sluzby.map((s) => ({ value: s.id, label: s.label }))]}
              />
              <FormField label="Datum vystavení" name="datum_vystaveni" type="date" defaultValue={todayIso()} />
              <FormField label="Datum splatnosti" name="datum_splatnosti" type="date" />
              <FormField label="Datum úhrady" name="datum_uhrazeni" type="date" />
              <FormField label="Částka bez DPH" name="castka_bez_dph" type="number" step="0.01" />
              <FormField label="DPH %" name="dph_sazba" type="number" step="0.01" defaultValue={21} />
              <FormField label="Celková částka" name="castka_celkem" type="number" step="0.01" />
              <FormSelect
                label="Stav"
                name="stav"
                defaultValue="rozpracovana"
                options={Object.entries(fakturaStavLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormSelect
                label="Typ faktury"
                name="typ_faktury"
                options={[
                  { value: "", label: "—" },
                  ...Object.entries(fakturaTypLabels).map(([value, label]) => ({ value, label })),
                ]}
              />
              <FormField label="External ref (FaktuMatch)" name="external_ref" hint="Pro budoucí napojení" />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Uložit</Button>
              <Button href="/faktury" variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
