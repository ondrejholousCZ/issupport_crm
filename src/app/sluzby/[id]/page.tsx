import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { UpravitSluzbaModal } from "@/components/sluzby/UpravitSluzbaModal";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { SluzbaUrgencyBadge } from "@/components/ui/SluzbaUrgencyBadge";
import { deleteSluzbaAction } from "@/lib/actions/sluzba";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { sluzbaFrekvenceLabels, sluzbaStavLabels } from "@/lib/labels";
import { getSluzba } from "@/lib/queries/sluzba";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function SluzbaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ upravit?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const { upravit } = await searchParams;
  const [row, zakaznici] = await Promise.all([getSluzba(id), listZakaznikOptions()]);
  if (!row) notFound();

  const showEdit = upravit === "1" || upravit === id;

  return (
    <AppShell
      title={row.nazev_sluzby}
      actions={
        <>
          <Button href={`/sluzby/${id}?upravit=1`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deleteSluzbaAction.bind(null, id)} />
        </>
      }
    >
      <Suspense fallback={null}>
        <UpravitSluzbaModal editRow={showEdit ? row : null} zakaznici={zakaznici} returnPath={`/sluzby/${id}`} />
      </Suspense>

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
          <p className="text-xs text-gray-500">
            Faktura se vystaví v den další fakturace, splatnost 14 dní.
          </p>
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
