import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { NovaPracovnikModalTrigger } from "@/components/pracovnici/NovaPracovnikModal";
import { UpravitPracovnikModal } from "@/components/pracovnici/UpravitPracovnikModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { pracovnikTypLabels } from "@/lib/labels";
import { getPracovnik, listPracovnici } from "@/lib/queries/pracovnik";

export default async function PracovniciPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; upravit?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [rows, editRow] = await Promise.all([
    listPracovnici(),
    params.upravit ? getPracovnik(params.upravit) : Promise.resolve(null),
  ]);
  if (params.upravit && !editRow) notFound();

  return (
    <AppShell
      title="Pracovníci"
      actions={
        <Suspense fallback={null}>
          <NovaPracovnikModalTrigger defaultOpen={params.nova === "1"} />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <UpravitPracovnikModal editRow={editRow} returnPath="/pracovnici" />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné pracovníky." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Jméno</th>
                <th className="text-left px-4 py-3 font-medium">E-mail</th>
                <th className="text-left px-4 py-3 font-medium">Typ</th>
                <th className="text-left px-4 py-3 font-medium">Náklad/hod</th>
                <th className="text-left px-4 py-3 font-medium">Platnost od</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/pracovnici?upravit=${row.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {row.prijmeni} {row.jmeno}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.email ?? "—"}</td>
                  <td className="px-4 py-3">{pracovnikTypLabels[row.typ]}</td>
                  <td className="px-4 py-3">{formatMoney(row.naklad_na_hodinu, row.mena)}</td>
                  <td className="px-4 py-3">{formatDate(row.sazba_platna_od)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AppShell>
  );
}
