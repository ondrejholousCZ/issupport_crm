import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { NovaSluzbaModalTrigger } from "@/components/sluzby/NovaSluzbaModal";
import { UpravitSluzbaModal } from "@/components/sluzby/UpravitSluzbaModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SluzbaUrgencyBadge } from "@/components/ui/SluzbaUrgencyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { sluzbaStavLabels } from "@/lib/labels";
import { getSluzba, listSluzby } from "@/lib/queries/sluzba";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function SluzbyPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; upravit?: string; zakaznik?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [rows, zakaznici, editRow] = await Promise.all([
    listSluzby(),
    listZakaznikOptions(),
    params.upravit ? getSluzba(params.upravit) : Promise.resolve(null),
  ]);
  if (params.upravit && !editRow) notFound();

  return (
    <AppShell
      title="Služby"
      actions={
        <Suspense fallback={null}>
          <NovaSluzbaModalTrigger
            zakaznici={zakaznici}
            defaultOpen={params.nova === "1"}
            defaultZakaznik={params.zakaznik ?? ""}
          />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <UpravitSluzbaModal editRow={editRow} zakaznici={zakaznici} returnPath="/sluzby" />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné služby." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Služba</th>
                <th className="text-left px-4 py-3 font-medium">Zákazník</th>
                <th className="text-left px-4 py-3 font-medium">Cena</th>
                <th className="text-left px-4 py-3 font-medium">Další fakturace</th>
                <th className="text-left px-4 py-3 font-medium">Urgence</th>
                <th className="text-left px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/sluzby?upravit=${row.id}`} className="text-primary hover:underline font-medium">
                      {row.nazev_sluzby}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.zakaznik_nazev}</td>
                  <td className="px-4 py-3">{formatMoney(row.cena_periody, row.mena)}</td>
                  <td className="px-4 py-3">{formatDate(row.dalsi_fakturace)}</td>
                  <td className="px-4 py-3">
                    <SluzbaUrgencyBadge dalsiFakturace={row.dalsi_fakturace} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={sluzbaStavLabels[row.stav]} tone={row.stav === "aktivni" ? "green" : "gray"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AppShell>
  );
}
