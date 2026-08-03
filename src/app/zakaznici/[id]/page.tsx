import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DeleteForm } from "@/components/DeleteForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deleteZakaznikAction } from "@/lib/actions/zakaznik";
import { requireSession } from "@/lib/auth/require-session";
import { formatDate, formatMoney } from "@/lib/format";
import {
  fakturaStavLabels,
  projektStavLabels,
  sluzbaStavLabels,
  zakaznikStavLabels,
} from "@/lib/labels";
import { listFaktury } from "@/lib/queries/faktura";
import { listPrace } from "@/lib/queries/prace";
import { listProjekty } from "@/lib/queries/projekt";
import { listSluzby } from "@/lib/queries/sluzba";
import { getZakaznik } from "@/lib/queries/zakaznik";

export default async function ZakaznikDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const zakaznik = await getZakaznik(id);
  if (!zakaznik) notFound();

  const [projekty, sluzby, faktury, prace] = await Promise.all([
    listProjekty(id),
    listSluzby(id),
    listFaktury(id),
    listPrace({ zakaznikId: id }),
  ]);

  return (
    <AppShell
      title={zakaznik.nazev}
      actions={
        <>
          <Button href={`/zakaznici/${id}/upravit`} variant="secondary">
            Upravit
          </Button>
          <DeleteForm action={deleteZakaznikAction.bind(null, id)} />
        </>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader title="Údaje" />
          <CardBody className="space-y-2 text-sm">
            <p><span className="text-gray-500">IČO:</span> {zakaznik.ico ?? "—"}</p>
            <p><span className="text-gray-500">IČ DPH:</span> {zakaznik.ic_dph ?? "—"}</p>
            <p><span className="text-gray-500">E-mail:</span> {zakaznik.kontaktni_email ?? "—"}</p>
            <p><span className="text-gray-500">Telefon:</span> {zakaznik.kontaktni_telefon ?? "—"}</p>
            <p>
              <span className="text-gray-500">Adresa:</span>{" "}
              {[zakaznik.fakturacni_ulice, zakaznik.fakturacni_mesto, zakaznik.fakturacni_psc]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
            <p>
              <span className="text-gray-500">Stav:</span>{" "}
              <StatusBadge label={zakaznikStavLabels[zakaznik.stav]} tone="green" />
            </p>
            {zakaznik.postup_fakturace ? (
              <p><span className="text-gray-500">Postup fakturace:</span> {zakaznik.postup_fakturace}</p>
            ) : null}
          </CardBody>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <Section title="Projekty" href={`/projekty/novy?zakaznik=${id}`}>
            {projekty.length === 0 ? (
              <EmptyState message="Žádné projekty." />
            ) : (
              <MiniTable
                headers={["Název", "Zakázka", "Sazba", "Stav"]}
                rows={projekty.map((p) => [
                  <Link key={p.id} href={`/projekty/${p.id}`} className="text-primary hover:underline">{p.nazev_projektu}</Link>,
                  p.zakazka ?? "—",
                  formatMoney(p.hodinova_sazba_fak, p.mena),
                  projektStavLabels[p.stav],
                ])}
              />
            )}
          </Section>

          <Section title="Služby" href={`/sluzby/nova?zakaznik=${id}`}>
            {sluzby.length === 0 ? (
              <EmptyState message="Žádné služby." />
            ) : (
              <MiniTable
                headers={["Název", "Další fakturace", "Stav"]}
                rows={sluzby.map((s) => [
                  <Link key={s.id} href={`/sluzby/${s.id}`} className="text-primary hover:underline">{s.nazev_sluzby}</Link>,
                  formatDate(s.dalsi_fakturace),
                  sluzbaStavLabels[s.stav],
                ])}
              />
            )}
          </Section>

          <Section title="Faktury" href={`/faktury/nova?zakaznik=${id}`}>
            {faktury.length === 0 ? (
              <EmptyState message="Žádné faktury." />
            ) : (
              <MiniTable
                headers={["Číslo", "Vystaveno", "Stav"]}
                rows={faktury.map((f) => [
                  <Link key={f.id} href={`/faktury/${f.id}`} className="text-primary hover:underline">{f.cislo_faktury ?? "—"}</Link>,
                  formatDate(f.datum_vystaveni),
                  fakturaStavLabels[f.stav],
                ])}
              />
            )}
          </Section>

          <Section title="Odvedená práce" href={`/prace?nova=1&zakaznik=${id}`}>
            {prace.length === 0 ? (
              <EmptyState message="Žádné záznamy práce." />
            ) : (
              <MiniTable
                headers={["Datum", "Projekt", "Částka"]}
                rows={prace.slice(0, 10).map((p) => [
                  formatDate(p.datum),
                  p.projekt_nazev ?? "—",
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

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="space-y-3">
        {children}
        <Button href={href} variant="secondary">
          + Přidat
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
