import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { NovaProjektModalTrigger } from "@/components/projekty/NovaProjektModal";
import { UpravitProjektModal } from "@/components/projekty/UpravitProjektModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatProjektSazba } from "@/lib/format";
import { projektStavLabels } from "@/lib/labels";
import { getProjekt, listProjekty } from "@/lib/queries/projekt";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function ProjektyPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; upravit?: string; zakaznik?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [rows, zakaznici, editRow] = await Promise.all([
    listProjekty(),
    listZakaznikOptions(),
    params.upravit ? getProjekt(params.upravit) : Promise.resolve(null),
  ]);
  if (params.upravit && !editRow) notFound();

  return (
    <AppShell
      title="Projekty"
      actions={
        <Suspense fallback={null}>
          <NovaProjektModalTrigger
            zakaznici={zakaznici}
            defaultOpen={params.nova === "1"}
            defaultZakaznik={params.zakaznik ?? ""}
          />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <UpravitProjektModal editRow={editRow} zakaznici={zakaznici} returnPath="/projekty" />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné projekty." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Projekt</th>
                <th className="text-left px-4 py-3 font-medium">Zakázka</th>
                <th className="text-left px-4 py-3 font-medium">Zákazník</th>
                <th className="text-left px-4 py-3 font-medium">Období</th>
                <th className="text-left px-4 py-3 font-medium">Sazba</th>
                <th className="text-left px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projekty?upravit=${row.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {row.nazev_projektu}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.zakazka ?? "—"}</td>
                  <td className="px-4 py-3">{row.zakaznik_nazev}</td>
                  <td className="px-4 py-3">
                    {formatDate(row.datum_od)} – {formatDate(row.datum_do)}
                  </td>
                  <td className="px-4 py-3">
                    {formatProjektSazba(row.hodinova_sazba_fak, row.mena, row.jednotka_sazby ?? "hodina")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={projektStavLabels[row.stav]} tone={row.stav === "aktivni" ? "green" : "yellow"} />
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
