import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { updateFakturaAction } from "@/lib/actions/faktura";
import { requireSession } from "@/lib/auth/require-session";
import { fakturaStavLabels, fakturaTypLabels } from "@/lib/labels";
import { getFaktura } from "@/lib/queries/faktura";
import { listProjektOptions } from "@/lib/queries/projekt";
import { listSluzbaOptions } from "@/lib/queries/sluzba";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function UpravitFakturuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getFaktura(id);
  if (!row) notFound();

  const [zakaznici, projekty, sluzby] = await Promise.all([
    listZakaznikOptions(),
    listProjektOptions(row.zakaznik_id),
    listSluzbaOptions(row.zakaznik_id),
  ]);

  return (
    <AppShell title="Upravit fakturu">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={updateFakturaAction.bind(null, id)} className="space-y-4">
            <FormGrid>
              <FormField label="Číslo faktury" name="cislo_faktury" defaultValue={row.cislo_faktury ?? ""} />
              <FormSelect
                label="Zákazník"
                name="zakaznik_id"
                required
                defaultValue={row.zakaznik_id}
                options={zakaznici.map((z) => ({ value: z.id, label: z.nazev }))}
              />
              <FormSelect
                label="Projekt"
                name="projekt_id"
                defaultValue={row.projekt_id ?? ""}
                options={[{ value: "", label: "—" }, ...projekty.map((p) => ({ value: p.id, label: p.label }))]}
              />
              <FormSelect
                label="Služba"
                name="sluzba_id"
                defaultValue={row.sluzba_id ?? ""}
                options={[{ value: "", label: "—" }, ...sluzby.map((s) => ({ value: s.id, label: s.label }))]}
              />
              <FormField label="Datum vystavení" name="datum_vystaveni" type="date" defaultValue={row.datum_vystaveni ?? ""} />
              <FormField label="Datum splatnosti" name="datum_splatnosti" type="date" defaultValue={row.datum_splatnosti ?? ""} />
              <FormField label="Datum úhrady" name="datum_uhrazeni" type="date" defaultValue={row.datum_uhrazeni ?? ""} />
              <FormField label="Částka bez DPH" name="castka_bez_dph" type="number" step="0.01" defaultValue={row.castka_bez_dph ?? ""} />
              <FormField label="DPH %" name="dph_sazba" type="number" step="0.01" defaultValue={row.dph_sazba ?? 21} />
              <FormField label="Celková částka" name="castka_celkem" type="number" step="0.01" defaultValue={row.castka_celkem ?? ""} />
              <FormSelect
                label="Stav"
                name="stav"
                defaultValue={row.stav}
                options={Object.entries(fakturaStavLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormSelect
                label="Typ faktury"
                name="typ_faktury"
                defaultValue={row.typ_faktury ?? ""}
                options={[
                  { value: "", label: "—" },
                  ...Object.entries(fakturaTypLabels).map(([value, label]) => ({ value, label })),
                ]}
              />
              <FormField label="External ref" name="external_ref" defaultValue={row.external_ref ?? ""} />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <SubmitButton>Uložit</SubmitButton>
              <Button href={`/faktury/${id}`} variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
