import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteFakturaAction } from "@/lib/actions/faktura";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { fakturaStavLabels, fakturaTypLabels } from "@/lib/labels";
import { getFaktura } from "@/lib/queries/faktura";

export default async function FakturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getFaktura(id);
  if (!row) notFound();

  return (
    <AppShell
      title={row.cislo_faktury ? `Faktura ${row.cislo_faktury}` : "Faktura"}
      actions={
        <>
          <Button href={`/faktury/${id}/upravit`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deleteFakturaAction.bind(null, id)} />
        </>
      }
    >
      <Card className="max-w-2xl">
        <CardHeader title="Detail faktury" />
        <CardBody className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Zákazník:</span>{" "}
            <Link href={`/zakaznici/${row.zakaznik_id}`} className="text-primary hover:underline">
              {row.zakaznik_nazev}
            </Link>
          </p>
          {row.projekt_nazev ? <p><span className="text-gray-500">Projekt:</span> {row.projekt_nazev}</p> : null}
          {row.sluzba_nazev ? <p><span className="text-gray-500">Služba:</span> {row.sluzba_nazev}</p> : null}
          <p><span className="text-gray-500">Vystaveno:</span> {formatDate(row.datum_vystaveni)}</p>
          <p><span className="text-gray-500">Splatnost:</span> {formatDate(row.datum_splatnosti)}</p>
          <p><span className="text-gray-500">Úhrada:</span> {formatDate(row.datum_uhrazeni)}</p>
          <p><span className="text-gray-500">Bez DPH:</span> {formatMoney(row.castka_bez_dph)}</p>
          <p><span className="text-gray-500">DPH:</span> {row.dph_sazba ?? "—"} %</p>
          <p><span className="text-gray-500">Celkem:</span> {formatMoney(row.castka_celkem)}</p>
          <p><span className="text-gray-500">Stav:</span> {fakturaStavLabels[row.stav]}</p>
          <p><span className="text-gray-500">Typ:</span> {row.typ_faktury ? fakturaTypLabels[row.typ_faktury] : "—"}</p>
        </CardBody>
      </Card>
    </AppShell>
  );
}
