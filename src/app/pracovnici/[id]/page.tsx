import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { deletePracovnikAction } from "@/lib/actions/pracovnik";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { pracovnikTypLabels } from "@/lib/labels";
import { getPracovnik } from "@/lib/queries/pracovnik";

export default async function PracovnikDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getPracovnik(id);
  if (!row) notFound();

  return (
    <AppShell
      title={`${row.prijmeni} ${row.jmeno}`}
      actions={
        <>
          <Button href={`/pracovnici/${id}/upravit`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deletePracovnikAction.bind(null, id)} />
        </>
      }
    >
      <Card className="max-w-2xl">
        <CardHeader title="Detail pracovníka" />
        <CardBody className="space-y-2 text-sm">
          <p><span className="text-gray-500">E-mail:</span> {row.email ?? "—"}</p>
          <p><span className="text-gray-500">Typ:</span> {pracovnikTypLabels[row.typ]}</p>
          <p><span className="text-gray-500">Náklad/hod:</span> {formatMoney(row.naklad_na_hodinu, row.mena)}</p>
          <p><span className="text-gray-500">Platnost od:</span> {formatDate(row.sazba_platna_od)}</p>
        </CardBody>
      </Card>
    </AppShell>
  );
}
