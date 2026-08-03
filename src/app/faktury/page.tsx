import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { FakturySubnav } from "@/components/faktury/FakturySubnav";
import { NovaFakturaModalTrigger } from "@/components/faktury/NovaFakturaModal";
import { UpravitFakturaModal } from "@/components/faktury/UpravitFakturaModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import { fakturaStavLabels } from "@/lib/labels";
import { getFaktura, listFaktury } from "@/lib/queries/faktura";
import { listProjektOptions } from "@/lib/queries/projekt";
import { listSluzbaOptions } from "@/lib/queries/sluzba";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

function stavTone(stav: string) {
  if (stav === "uhrazena") return "green" as const;
  if (stav === "po_splatnosti") return "red" as const;
  if (stav === "vystavena") return "blue" as const;
  return "gray" as const;
}

export default async function FakturyPage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; upravit?: string; zakaznik?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [rows, zakaznici, projekty, sluzby, editRow] = await Promise.all([
    listFaktury(),
    listZakaznikOptions(),
    listProjektOptions(),
    listSluzbaOptions(),
    params.upravit ? getFaktura(params.upravit) : Promise.resolve(null),
  ]);
  if (params.upravit && !editRow) notFound();

  return (
    <AppShell
      title="Faktury"
      actions={
        <Suspense fallback={null}>
          <NovaFakturaModalTrigger
            zakaznici={zakaznici}
            projekty={projekty}
            sluzby={sluzby}
            defaultOpen={params.nova === "1"}
            defaultZakaznik={params.zakaznik ?? ""}
          />
        </Suspense>
      }
    >
      <FakturySubnav />
      <Suspense fallback={null}>
        <UpravitFakturaModal
          editRow={editRow}
          zakaznici={zakaznici}
          projekty={projekty}
          sluzby={sluzby}
          returnPath="/faktury"
        />
      </Suspense>

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
                    <Link
                      href={`/faktury?upravit=${row.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {row.cislo_faktury ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/zakaznici/${row.zakaznik_id}`} className="text-primary hover:underline">
                      {row.zakaznik_nazev}
                    </Link>
                  </td>
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
