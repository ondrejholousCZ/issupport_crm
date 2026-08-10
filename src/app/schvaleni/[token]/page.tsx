import { notFound } from "next/navigation";
import { ApprovalForm } from "@/components/schvaleni/ApprovalForm";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
import { MESICE_LABELS } from "@/lib/prace-filters";
import { vykazStavLabels } from "@/lib/labels";
import { summarizePrace, formatTotalHours } from "@/lib/prace-summary";
import { getVykazByToken, getVykazPolozkyByToken } from "@/lib/queries/vykaz-prace";
import { exportCastka } from "@/lib/work-hours";

function obdobiLabel(obdobi: string) {
  const [rok, mesic] = obdobi.split("-");
  if (!mesic) return obdobi;
  return `${MESICE_LABELS[Number(mesic) - 1] ?? mesic} ${rok}`;
}

export default async function SchvaleniPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ schvaleno?: string }>;
}) {
  const { token } = await params;
  const { schvaleno } = await searchParams;

  const vykaz = await getVykazByToken(token);
  if (!vykaz) notFound();

  const polozky = await getVykazPolozkyByToken(token);
  const summary = summarizePrace(polozky);
  const locked = vykaz.stav === "schvaleny" || schvaleno === "1";

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-wider text-gray-500">ISSP</p>
          <h1 className="text-2xl font-semibold mt-1">Výkaz práce ke schválení</h1>
        </div>

        <Card>
          <CardHeader title={`${vykaz.zakaznik_nazev} — ${obdobiLabel(vykaz.obdobi)}`} />
          <CardBody className="space-y-4">
            <StatusBadge
              label={vykazStavLabels[vykaz.stav]}
              tone={vykaz.stav === "schvaleny" ? "green" : "blue"}
            />
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                Čas celkem: <strong className="text-foreground">{formatTotalHours(summary.totalHours)}</strong>
              </span>
              <span>
                Částka celkem: <strong className="text-foreground">{formatMoney(summary.totalCastka)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Datum</th>
                    <th className="text-left px-3 py-2">Projekt</th>
                    <th className="text-left px-3 py-2">Pracovník</th>
                    <th className="text-left px-3 py-2">Popis</th>
                    <th className="text-right px-3 py-2">Čas</th>
                    <th className="text-right px-3 py-2">Částka</th>
                  </tr>
                </thead>
                <tbody>
                  {polozky.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.datum)}</td>
                      <td className="px-3 py-2">{p.projekt_zakazka ?? p.projekt_nazev}</td>
                      <td className="px-3 py-2">{p.pracovnik_jmeno}</td>
                      <td className="px-3 py-2 max-w-xs">{p.popis ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{formatCas(p.hodiny, p.minuty)}</td>
                      <td className="px-3 py-2 text-right">
                        {formatMoney(
                          exportCastka(
                            p.hodiny,
                            p.minuty,
                            p.projekt_sazba_fak,
                            p.castka_fakturace,
                            p.projekt_jednotka_sazby ?? "hodina",
                          ),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {locked ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm">
                <p className="font-medium text-green-800">Výkaz byl schválen.</p>
                {vykaz.schvaleno_at ? (
                  <p className="text-green-700 mt-1">
                    {formatDate(vykaz.schvaleno_at)}
                  </p>
                ) : null}
                {vykaz.poznamka_klienta ? (
                  <p className="text-gray-700 mt-2">
                    <span className="text-gray-500">Poznámka: </span>
                    {vykaz.poznamka_klienta}
                  </p>
                ) : null}
              </div>
            ) : vykaz.stav === "odeslany" ? (
              <ApprovalForm token={token} />
            ) : (
              <p className="text-sm text-gray-500">Tento výkaz zatím není k dispozici ke schválení.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
