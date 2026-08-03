import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { SluzbaUrgencyBadge } from "@/components/ui/SluzbaUrgencyBadge";
import { deleteSluzbaAction } from "@/lib/actions/sluzba";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { sluzbaFrekvenceLabels, sluzbaStavLabels } from "@/lib/labels";
import { getSluzba } from "@/lib/queries/sluzba";

export default async function SluzbaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getSluzba(id);
  if (!row) notFound();

  return (
    <AppShell
      title={row.nazev_sluzby}
      actions={
        <>
          <Button href={`/sluzby/${id}/upravit`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deleteSluzbaAction.bind(null, id)} />
        </>
      }
    >
      <Card className="max-w-2xl">
        <CardHeader title="Detail služby" />
        <CardBody className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Zákazník:</span>{" "}
            <Link href={`/zakaznici/${row.zakaznik_id}`} className="text-primary hover:underline">
              {row.zakaznik_nazev}
            </Link>
          </p>
          <p>
            <span className="text-gray-500">Frekvence:</span>{" "}
            {row.frekvence ? sluzbaFrekvenceLabels[row.frekvence] : "—"}
            {row.frekvence_dnu ? ` (${row.frekvence_dnu} dní)` : ""}
          </p>
          <p><span className="text-gray-500">Cena:</span> {formatMoney(row.cena_periody, row.mena)}</p>
          <p><span className="text-gray-500">Poslední platba:</span> {formatDate(row.posledni_platba)}</p>
          <p><span className="text-gray-500">Další fakturace:</span> {formatDate(row.dalsi_fakturace)}</p>
          <p>
            <span className="text-gray-500">Urgence:</span>{" "}
            <SluzbaUrgencyBadge dalsiFakturace={row.dalsi_fakturace} />
          </p>
          <p><span className="text-gray-500">Stav:</span> {sluzbaStavLabels[row.stav]}</p>
        </CardBody>
      </Card>
    </AppShell>
  );
}
