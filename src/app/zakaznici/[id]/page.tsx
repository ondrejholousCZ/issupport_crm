import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { UpravitZakaznikModal } from "@/components/zakaznici/UpravitZakaznikModal";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deleteZakaznikAction } from "@/lib/actions/zakaznik";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney, formatProjektSazba } from "@/lib/format";
import {
  fakturaStavLabels,
  projektStavLabels,
  sluzbaStavLabels,
  vykazStavLabels,
  zakaznikStavLabels,
} from "@/lib/labels";
import { MESICE_LABELS } from "@/lib/prace-filters";
import { listFaktury } from "@/lib/queries/faktura";
import { listPrace } from "@/lib/queries/prace";
import { listProjekty } from "@/lib/queries/projekt";
import { listSluzby } from "@/lib/queries/sluzba";
import { listVykazy } from "@/lib/queries/vykaz-prace";
import { getZakaznik } from "@/lib/queries/zakaznik";
import type { VykazStav } from "@/lib/types";

function obdobiLabel(obdobi: string) {
  const [rok, mesic] = obdobi.split("-");
  if (!mesic) return obdobi;
  return `${MESICE_LABELS[Number(mesic) - 1] ?? mesic} ${rok}`;
}

function vykazTone(stav: VykazStav) {
  if (stav === "schvaleny") return "green" as const;
  if (stav === "odeslany") return "blue" as const;
  return "yellow" as const;
}

export default async function ZakaznikDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ upravit?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const { upravit } = await searchParams;
  const zakaznik = await getZakaznik(id);
  if (!zakaznik) notFound();

  const showEdit = upravit === "1" || upravit === id;

  const [projekty, sluzby, faktury, prace, vykazy] = await Promise.all([
    listProjekty(id),
    listSluzby(id),
    listFaktury(id),
    listPrace({ zakaznikIds: [id] }),
    listVykazy({ zakaznikId: id }),
  ]);

  const adresa =
    [zakaznik.fakturacni_ulice, zakaznik.fakturacni_mesto, zakaznik.fakturacni_psc]
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <AppShell
      title={zakaznik.nazev}
      actions={
        <>
          <Button href={`/zakaznici/${id}?upravit=1`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deleteZakaznikAction.bind(null, id)} />
        </>
      }
    >
      <Suspense fallback={null}>
        <UpravitZakaznikModal editRow={showEdit ? zakaznik : null} returnPath={`/zakaznici/${id}`} />
      </Suspense>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Údaje" />
          <CardBody>
            <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <InfoItem label="IČO" value={zakaznik.ico ?? "—"} />
              <InfoItem label="Zkratka" value={zakaznik.zkratka ?? "—"} />
              <InfoItem label="Kontaktní e-mail" value={zakaznik.kontaktni_email ?? "—"} />
              <InfoItem label="Fakturační e-mail" value={zakaznik.fakturacni_email ?? "—"} />
              <InfoItem label="Telefon" value={zakaznik.kontaktni_telefon ?? "—"} />
              <InfoItem label="Adresa" value={adresa} />
              <div>
                <dt className="text-gray-500">Stav</dt>
                <dd className="mt-0.5">
                  <StatusBadge label={zakaznikStavLabels[zakaznik.stav]} tone="green" />
                </dd>
              </div>
              {zakaznik.postup_fakturace ? (
                <InfoItem label="Postup fakturace" value={zakaznik.postup_fakturace} />
              ) : null}
            </dl>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Projekty" href={`/projekty?nova=1&zakaznik=${id}`}>
            {projekty.length === 0 ? (
              <EmptyState message="Žádné projekty." />
            ) : (
              <MiniTable
                headers={["Název", "Zakázka", "Sazba", "Stav"]}
                rows={projekty.map((p) => [
                  <Link key={p.id} href={`/projekty?upravit=${p.id}`} className="text-primary hover:underline">{p.nazev_projektu}</Link>,
                  p.zakazka ?? "—",
                  formatProjektSazba(p.hodinova_sazba_fak, p.mena, p.jednotka_sazby ?? "hodina"),
                  projektStavLabels[p.stav],
                ])}
              />
            )}
          </Section>

          <Section title="Služby" href={`/sluzby?nova=1&zakaznik=${id}`}>
            {sluzby.length === 0 ? (
              <EmptyState message="Žádné služby." />
            ) : (
              <MiniTable
                headers={["Název", "Další fakturace", "Stav"]}
                rows={sluzby.map((s) => [
                  <Link key={s.id} href={`/sluzby?upravit=${s.id}`} className="text-primary hover:underline">{s.nazev_sluzby}</Link>,
                  formatDate(s.dalsi_fakturace),
                  sluzbaStavLabels[s.stav],
                ])}
              />
            )}
          </Section>

          <Section title="Faktury" href={`/faktury?nova=1&zakaznik=${id}`}>
            {faktury.length === 0 ? (
              <EmptyState message="Žádné faktury." />
            ) : (
              <MiniTable
                headers={["Číslo", "Vystaveno", "Stav"]}
                rows={faktury.map((f) => [
                  <Link key={f.id} href={`/faktury?upravit=${f.id}`} className="text-primary hover:underline">{f.cislo_faktury ?? "—"}</Link>,
                  formatDate(f.datum_vystaveni),
                  fakturaStavLabels[f.stav],
                ])}
              />
            )}
          </Section>

          <Section title="Výkazy práce" href={`/prace?zakaznik=${id}`} addLabel="Vytvořit z práce">
            {vykazy.length === 0 ? (
              <EmptyState message="Žádné výkazy." />
            ) : (
              <MiniTable
                headers={["Období", "Položek", "Stav", "Příjemce", "Odesláno"]}
                rows={vykazy.map((v) => [
                  <Link key={v.id} href={`/vykazy?detail=${v.id}`} className="text-primary hover:underline">
                    {obdobiLabel(v.obdobi)}
                  </Link>,
                  v.pocet_polozek ?? 0,
                  <StatusBadge
                    key={`${v.id}-stav`}
                    label={vykazStavLabels[v.stav]}
                    tone={vykazTone(v.stav)}
                  />,
                  v.odeslano_email ?? "—",
                  v.odeslano_at ? formatDate(v.odeslano_at) : "—",
                ])}
              />
            )}
          </Section>

          <Section title="Odvedená práce" href={`/prace?nova=1&zakaznik=${id}`} className="lg:col-span-2">
            {prace.length === 0 ? (
              <EmptyState message="Žádné záznamy práce." />
            ) : (
              <MiniTable
                headers={["Datum", "Projekt", "Částka"]}
                rows={prace.slice(0, 10).map((p) => [
                  formatDate(p.datum),
                  p.projekt_zakazka ?? p.projekt_nazev ?? "—",
                  formatMoney(p.castka_fakturace),
                ])}
              />
            )}
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function Section({
  title,
  href,
  addLabel = "+ Přidat",
  className,
  children,
}: {
  title: string;
  href: string;
  addLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader title={title} />
      <CardBody className="space-y-3">
        {children}
        <Button href={href} variant="secondary">
          {addLabel}
        </Button>
      </CardBody>
    </Card>
  );
}

function MiniTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b border-border">
          {headers.map((h) => (
            <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} className="border-b border-border last:border-0">
            {cells.map((cell, j) => (
              <td key={j} className="py-2 pr-4">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
