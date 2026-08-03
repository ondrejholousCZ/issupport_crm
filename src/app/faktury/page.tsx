import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FakturySubnav } from "@/components/faktury/FakturySubnav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { fakturaStavLabels } from "@/lib/labels";
import { listFaktury } from "@/lib/queries/faktura";

function stavTone(stav: string) {
  if (stav === "uhrazena") return "green" as const;
  if (stav === "po_splatnosti") return "red" as const;
  if (stav === "vystavena") return "blue" as const;
  return "gray" as const;
}

export default async function FakturyPage() {
  if (!(await requireSession())) redirect("/login");
  const rows = await listFaktury();

  return (
    <AppShell title="Faktury" actions={<Button href="/faktury/nova">+ Nová faktura</Button>}>
      <FakturySubnav />
      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné faktury." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Číslo</th>
                <th className="text-left px-4 py-3 font-medium">Zákazník</th>
                <th className="text-left px-4 py-3 font-medium">Vystaveno</th>
                <th className="text-left px-4 py-3 font-medium">Splatnost</th>
                <th className="text-left px-4 py-3 font-medium">Částka</th>
                <th className="text-left px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/faktury/${row.id}`} className="text-primary hover:underline font-medium">
                      {row.cislo_faktury ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.zakaznik_nazev}</td>
                  <td className="px-4 py-3">{formatDate(row.datum_vystaveni)}</td>
                  <td className="px-4 py-3">{formatDate(row.datum_splatnosti)}</td>
                  <td className="px-4 py-3">{formatMoney(row.castka_celkem)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={fakturaStavLabels[row.stav]} tone={stavTone(row.stav)} />
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
