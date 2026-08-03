import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NovaPraceModalTrigger } from "@/components/prace/NovaPraceModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
import { stavFakturaceLabels } from "@/lib/labels";
import { listPracovnikOptions } from "@/lib/queries/pracovnik";
import { listProjektOptions } from "@/lib/queries/projekt";
import { listPrace } from "@/lib/queries/prace";

export default async function PracePage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; zakaznik?: string; projekt?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [rows, projekty, pracovnici] = await Promise.all([
    listPrace(),
    listProjektOptions(params.zakaznik),
    listPracovnikOptions(),
  ]);

  return (
    <AppShell
      title="Odvedená práce"
      actions={
        <NovaPraceModalTrigger
          projekty={projekty}
          pracovnici={pracovnici}
          defaultOpen={params.nova === "1"}
          defaultProjekt={params.projekt ?? ""}
        />
      }
    >
      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné záznamy odvedené práce." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Datum</th>
                <th className="text-left px-4 py-3 font-medium">Zákazník / Projekt</th>
                <th className="text-left px-4 py-3 font-medium">Pracovník</th>
                <th className="text-left px-4 py-3 font-medium">Čas</th>
                <th className="text-left px-4 py-3 font-medium">Fakturace</th>
                <th className="text-left px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3">{formatDate(row.datum)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/prace/${row.id}`} className="text-primary hover:underline font-medium block">
                      {row.zakaznik_nazev}
                    </Link>
                    <span className="text-gray-500 text-xs">{row.projekt_nazev}</span>
                  </td>
                  <td className="px-4 py-3">{row.pracovnik_jmeno}</td>
                  <td className="px-4 py-3">{formatCas(row.hodiny, row.minuty)}</td>
                  <td className="px-4 py-3">{formatMoney(row.castka_fakturace)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={stavFakturaceLabels[row.stav_fakturace]}
                      tone={row.stav_fakturace === "nefakturovano" ? "yellow" : "green"}
                    />
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
