import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { deletePraceAction } from "@/lib/actions/prace";
import { requireSession } from "@/lib/auth/require-session";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
import { druhCinnostiLabels, stavFakturaceLabels } from "@/lib/labels";
import { getPrace } from "@/lib/queries/prace";

export default async function PraceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getPrace(id);
  if (!row) notFound();

  return (
    <AppShell
      title={`Práce ${formatDate(row.datum)}`}
      actions={
        <>
          <Button href={`/prace/${id}/upravit`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deletePraceAction.bind(null, id)} />
        </>
      }
    >
      <Card className="max-w-2xl">
        <CardHeader title="Detail odvedené práce" />
        <CardBody className="space-y-2 text-sm">
          <p><span className="text-gray-500">Datum:</span> {formatDate(row.datum)}</p>
          <p>
            <span className="text-gray-500">Zákazník:</span>{" "}
            <Link href={`/zakaznici/${row.zakaznik_id}`} className="text-primary hover:underline">
              {row.zakaznik_nazev}
            </Link>
          </p>
          <p>
            <span className="text-gray-500">Projekt:</span>{" "}
            <Link href={`/projekty/${row.projekt_id}`} className="text-primary hover:underline">
              {row.projekt_nazev}
            </Link>
          </p>
          <p><span className="text-gray-500">Pracovník:</span> {row.pracovnik_jmeno}</p>
          <p><span className="text-gray-500">Čas:</span> {formatCas(row.hodiny, row.minuty)}</p>
          <p><span className="text-gray-500">Druh:</span> {row.druh_cinnosti ? druhCinnostiLabels[row.druh_cinnosti] : "—"}</p>
          <p><span className="text-gray-500">Fakturace:</span> {formatMoney(row.castka_fakturace)}</p>
          <p><span className="text-gray-500">Náklady:</span> {formatMoney(row.castka_naklady)}</p>
          <p><span className="text-gray-500">Stav fakturace:</span> {stavFakturaceLabels[row.stav_fakturace]}</p>
          {row.popis ? <p><span className="text-gray-500">Popis:</span> {row.popis}</p> : null}
        </CardBody>
      </Card>
    </AppShell>
  );
}
