import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { VykazDetailModal } from "@/components/vykazy/VykazDetailModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth/require-session";
import { MESICE_LABELS } from "@/lib/prace-filters";
import { vykazStavLabels } from "@/lib/labels";
import { getFaktura } from "@/lib/queries/faktura";
import { prepareInvoiceDraftFromVykaz } from "@/lib/queries/faktura-from-vykaz";
import { getVykaz, getVykazPolozky, listVykazy } from "@/lib/queries/vykaz-prace";
import type { InvoiceDraft } from "@/lib/faktura-sablona";
import type { Faktura } from "@/lib/types";

function obdobiLabel(obdobi: string) {
  const [rok, mesic] = obdobi.split("-");
  if (!mesic) return obdobi;
  return `${MESICE_LABELS[Number(mesic) - 1] ?? mesic} ${rok}`;
}

function vykazTone(stav: string) {
  if (stav === "schvaleny") return "green" as const;
  if (stav === "odeslany") return "blue" as const;
  return "yellow" as const;
}

export default async function VykazyPage({
  searchParams,
}: {
  searchParams: Promise<{ detail?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;

  const [rows, detailVykaz, detailPolozky] = await Promise.all([
    listVykazy(),
    params.detail ? getVykaz(params.detail) : Promise.resolve(null),
    params.detail ? getVykazPolozky(params.detail) : Promise.resolve([]),
  ]);

  if (params.detail && !detailVykaz) notFound();

  let linkedFaktura: Faktura | null = null;
  let invoiceDraft: InvoiceDraft | null = null;

  if (detailVykaz?.faktura_id) {
    linkedFaktura = await getFaktura(detailVykaz.faktura_id);
  } else if (detailVykaz?.stav === "schvaleny") {
    try {
      invoiceDraft = await prepareInvoiceDraftFromVykaz(detailVykaz.id);
    } catch {
      invoiceDraft = null;
    }
  }

  return (
    <AppShell title="Výkazy práce">
      <Suspense fallback={null}>
        <VykazDetailModal
          vykaz={detailVykaz}
          polozky={detailPolozky}
          invoiceDraft={invoiceDraft}
          linkedFaktura={linkedFaktura}
        />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné výkazy. Vytvořte je z odvedené práce." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Období</th>
                <th className="text-left px-4 py-3 font-medium">Zákazník</th>
                <th className="text-left px-4 py-3 font-medium">Položek</th>
                <th className="text-left px-4 py-3 font-medium">Stav</th>
                <th className="text-left px-4 py-3 font-medium">Příjemce</th>
                <th className="text-left px-4 py-3 font-medium">Odesláno</th>
                <th className="text-left px-4 py-3 font-medium">Schváleno</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/vykazy?detail=${row.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {obdobiLabel(row.obdobi)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.zakaznik_nazev}</td>
                  <td className="px-4 py-3">{row.pocet_polozek ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={vykazStavLabels[row.stav]}
                      tone={vykazTone(row.stav)}
                    />
                  </td>
                  <td className="px-4 py-3">{row.odeslano_email ?? "—"}</td>
                  <td className="px-4 py-3">{row.odeslano_at ? new Date(row.odeslano_at).toLocaleDateString("cs-CZ") : "—"}</td>
                  <td className="px-4 py-3">{row.schvaleno_at ? new Date(row.schvaleno_at).toLocaleDateString("cs-CZ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AppShell>
  );
}
