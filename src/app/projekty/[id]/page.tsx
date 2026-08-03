import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth/require-session";
import { deleteProjektAction } from "@/lib/actions/projekt";
import { formatDate, formatMoney } from "@/lib/format";
import { projektStavLabels } from "@/lib/labels";
import { getProjekt } from "@/lib/queries/projekt";

export default async function ProjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getProjekt(id);
  if (!row) notFound();

  return (
    <AppShell
      title={row.nazev_projektu}
      actions={
        <>
          <Button href={`/projekty/${id}/upravit`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deleteProjektAction.bind(null, id)} />
        </>
      }
    >
      <Card className="max-w-2xl">
        <CardHeader title="Detail projektu" />
        <CardBody className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Zákazník:</span>{" "}
            <Link href={`/zakaznici/${row.zakaznik_id}`} className="text-primary hover:underline">
              {row.zakaznik_nazev}
            </Link>
          </p>
          <p><span className="text-gray-500">Období:</span> {formatDate(row.datum_od)} – {formatDate(row.datum_do)}</p>
          <p><span className="text-gray-500">Sazba:</span> {formatMoney(row.hodinova_sazba_fak, row.mena)}</p>
          <p><span className="text-gray-500">Stav:</span> {projektStavLabels[row.stav]}</p>
        </CardBody>
      </Card>
    </AppShell>
  );
}
