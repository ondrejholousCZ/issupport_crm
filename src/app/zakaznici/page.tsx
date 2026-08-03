import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { NovaZakaznikModalTrigger } from "@/components/zakaznici/NovaZakaznikModal";
import { UpravitZakaznikModal } from "@/components/zakaznici/UpravitZakaznikModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { zakaznikStavLabels } from "@/lib/labels";
import { getZakaznik, listZakaznici } from "@/lib/queries/zakaznik";
import Link from "next/link";

export default async function ZakazniciPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; upravit?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const editRow = params.upravit ? await getZakaznik(params.upravit) : null;
  if (params.upravit && !editRow) notFound();

  const rows = await listZakaznici();

  return (
    <AppShell
      title="Zákazníci"
      actions={
        <Suspense fallback={null}>
          <NovaZakaznikModalTrigger defaultOpen={params.nova === "1"} />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <UpravitZakaznikModal editRow={editRow} returnPath="/zakaznici" />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné zákazníky." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Název</th>
                <th className="text-left px-4 py-3 font-medium">Zkratka</th>
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
                  <td className="px-4 py-3">{row.zkratka ?? "—"}</td>
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
