import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { zakaznikStavLabels } from "@/lib/labels";
import { listZakaznici } from "@/lib/queries/zakaznik";

export default async function ZakazniciPage() {
  if (!(await requireSession())) redirect("/login");
  const rows = await listZakaznici();

  return (
    <AppShell title="Zákazníci" actions={<Button href="/zakaznici/novy">+ Nový zákazník</Button>}>
      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné zákazníky." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Název</th>
                <th className="text-left px-4 py-3 font-medium">IČO</th>
                <th className="text-left px-4 py-3 font-medium">E-mail</th>
                <th className="text-left px-4 py-3 font-medium">Stav</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/zakaznici/${row.id}`} className="text-primary hover:underline font-medium">
                      {row.nazev}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.ico ?? "—"}</td>
                  <td className="px-4 py-3">{row.kontaktni_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={zakaznikStavLabels[row.stav]}
                      tone={row.stav === "aktivni" ? "green" : "gray"}
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
