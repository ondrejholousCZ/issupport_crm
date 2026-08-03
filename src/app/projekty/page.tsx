import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { projektStavLabels } from "@/lib/labels";
import { listProjekty } from "@/lib/queries/projekt";

export default async function ProjektyPage() {
  if (!(await requireSession())) redirect("/login");
  const rows = await listProjekty();

  return (
    <AppShell title="Projekty" actions={<Button href="/projekty/novy">+ Nový projekt</Button>}>
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
                    <Link href={`/projekty/${row.id}`} className="text-primary hover:underline font-medium">
                      {row.nazev_projektu}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.zakazka ?? "—"}</td>
                  <td className="px-4 py-3">{row.zakaznik_nazev}</td>
                  <td className="px-4 py-3">
                    {formatDate(row.datum_od)} – {formatDate(row.datum_do)}
                  </td>
                  <td className="px-4 py-3">{formatMoney(row.hodinova_sazba_fak, row.mena)}</td>
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
