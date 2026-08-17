import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/format";
import { fakturaStavLabels } from "@/lib/labels";
import type { TimelineMonthData } from "@/lib/fakturace-timeline";

function TimelineCard({
  href,
  tone,
  title,
  subtitle,
  amount,
}: {
  href: string;
  tone: "blue" | "amber" | "green" | "gray";
  title: string;
  subtitle: string;
  amount?: string;
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50/60 hover:bg-blue-50",
    amber: "border-amber-200 bg-amber-50/60 hover:bg-amber-50",
    green: "border-green-200 bg-green-50/60 hover:bg-green-50",
    gray: "border-gray-200 bg-gray-50/60 hover:bg-gray-50",
  };

  return (
    <Link
      href={href}
      className={`block rounded-lg border px-2.5 py-2 text-xs transition-colors ${tones[tone]}`}
    >
      <p className="font-medium text-foreground truncate">{title}</p>
      <p className="text-gray-600 truncate mt-0.5">{subtitle}</p>
      {amount ? <p className="text-gray-800 mt-1 font-medium">{amount}</p> : null}
    </Link>
  );
}

export function FakturaceTimelineView({ timeline }: { timeline: TimelineMonthData[] }) {
  const hasAny = timeline.some(
    (m) => m.sluzby.length > 0 || m.prace.length > 0 || m.faktury.length > 0,
  );

  if (!hasAny) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        V zobrazeném období nejsou žádné položky k fakturaci ani vystavené faktury.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {timeline.map((month) => {
          const total =
            month.sluzby.length + month.prace.length + month.faktury.length;
          return (
            <div
              key={month.key}
              className={`w-[220px] shrink-0 rounded-xl border ${
                month.isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-white"
              }`}
            >
              <div
                className={`px-3 py-2.5 border-b border-border ${
                  month.isCurrent ? "bg-primary/10" : "bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold">{month.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {total === 0
                    ? "Prázdné"
                    : `${total} ${total === 1 ? "položka" : total < 5 ? "položky" : "položek"}`}
                </p>
              </div>

              <div className="p-2 space-y-2 min-h-[120px] max-h-[480px] overflow-y-auto">
                {month.sluzby.map((s) => (
                  <TimelineCard
                    key={`s-${s.id}-${s.datum}`}
                    href={`/sluzby?upravit=${s.id}`}
                    tone="blue"
                    title={s.nazev}
                    subtitle={s.zakaznikNazev}
                    amount={formatMoney(s.castka, s.mena)}
                  />
                ))}

                {month.prace.map((p) => (
                  <TimelineCard
                    key={`p-${p.projektId}-${month.key}`}
                    href={`/prace?mesic=${month.key}&zakaznik=${p.zakaznikId}&projekt=${encodeURIComponent(p.projektZakazka)}&stav=nefakturovano`}
                    tone="amber"
                    title={p.projektZakazka}
                    subtitle={`${p.zakaznikNazev} · ${p.pocet} záznamů`}
                    amount={formatMoney(p.castka)}
                  />
                ))}

                {month.faktury.map((f) => (
                  <TimelineCard
                    key={`f-${f.id}`}
                    href={`/faktury/timeline?upravit=${f.id}`}
                    tone={f.stav === "uhrazena" ? "gray" : "green"}
                    title={f.cislo ? `Faktura ${f.cislo}` : "Faktura"}
                    subtitle={`${f.zakaznikNazev} · ${fakturaStavLabels[f.stav as keyof typeof fakturaStavLabels] ?? f.stav}`}
                    amount={formatMoney(f.castka)}
                  />
                ))}

                {total === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">—</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimelineLegend() {
  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-blue-200 bg-blue-50" />
          Služba k fakturaci
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-amber-200 bg-amber-50" />
          Ne fakturovaná práce
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-green-200 bg-green-50" />
          Vystavená faktura
        </span>
      </div>
    </Card>
  );
}
