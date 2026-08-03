import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SluzbaUrgencyBadge } from "@/components/ui/SluzbaUrgencyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { sluzbaStavLabels } from "@/lib/labels";
import { listSluzby } from "@/lib/queries/sluzba";

export default async function SluzbyPage() {
  if (!(await requireSession())) redirect("/login");
  const rows = await listSluzby();

  return (
    <AppShell title="Služby" actions={<Button href="/sluzby/nova">+ Nová služba</Button>}>
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
                    <Link href={`/sluzby/${row.id}`} className="text-primary hover:underline font-medium">
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
