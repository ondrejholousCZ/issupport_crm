import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card, CardBody } from "@/components/ui/Card";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { updatePracovnikAction } from "@/lib/actions/pracovnik";
import { requireSession } from "@/lib/auth/require-session";
import { pracovnikTypLabels } from "@/lib/labels";
import { getPracovnik } from "@/lib/queries/pracovnik";

export default async function UpravitPracovnikaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getPracovnik(id);
  if (!row) notFound();

  return (
    <AppShell title="Upravit pracovníka">
      <Card className="max-w-3xl">
        <CardBody>
          <form action={updatePracovnikAction.bind(null, id)} className="space-y-4">
            <FormGrid>
              <FormField label="Jméno" name="jmeno" required defaultValue={row.jmeno} />
              <FormField label="Příjmení" name="prijmeni" required defaultValue={row.prijmeni} />
              <FormField label="E-mail" name="email" type="email" defaultValue={row.email ?? ""} />
              <FormSelect
                label="Typ"
                name="typ"
                defaultValue={row.typ}
                options={Object.entries(pracovnikTypLabels).map(([value, label]) => ({ value, label }))}
              />
              <FormField label="Náklad na hodinu" name="naklad_na_hodinu" type="number" step="0.01" defaultValue={row.naklad_na_hodinu ?? ""} />
              <FormField label="Měna" name="mena" defaultValue={row.mena} />
              <FormField label="Sazba platná od" name="sazba_platna_od" type="date" defaultValue={row.sazba_platna_od ?? ""} />
            </FormGrid>
            <div className="flex gap-2 pt-2">
              <SubmitButton>Uložit</SubmitButton>
              <Button href={`/pracovnici/${id}`} variant="secondary">
                Zrušit
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </AppShell>
  );
}
