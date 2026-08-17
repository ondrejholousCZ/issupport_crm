import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { NovaPraceModalTrigger } from "@/components/prace/NovaPraceModal";
import { PraceFilters } from "@/components/prace/PraceFilters";
import { PraceTable } from "@/components/prace/PraceTable";
import { UpravitPraceModal } from "@/components/prace/UpravitPraceModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth/require-session";
import { parsePraceFilters, praceFiltersToQuery } from "@/lib/prace-filters";
import { summarizePrace } from "@/lib/prace-summary";
import { listDistinctProjektZakazky, listProjektOptions, resolveProjektFilterValues } from "@/lib/queries/projekt";
import { getPracovnikIdByEmail, listPracovnikOptions } from "@/lib/queries/pracovnik";
import { getPrace, listPrace } from "@/lib/queries/prace";
import { listRozpracovaneVykazy } from "@/lib/queries/vykaz-prace";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function PracePage({
  searchParams,
}: {
  searchParams: Promise<{
    nova?: string;
    upravit?: string;
    mesic?: string;
    pracovnik?: string;
    projekt?: string;
    zakaznik?: string;
    stav?: string;
  }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const rawFilters = parsePraceFilters(params);
  const projektZakazky = await resolveProjektFilterValues(rawFilters.projektZakazky);
  const filters = { ...rawFilters, projektZakazky };

  if (projektZakazky.join(",") !== rawFilters.projektZakazky.join(",")) {
    const extra: Record<string, string> = {};
    if (params.nova) extra.nova = params.nova;
    if (params.upravit) extra.upravit = params.upravit;
    redirect(`/prace?${praceFiltersToQuery(filters, extra)}`);
  }

  const editRow = params.upravit ? await getPrace(params.upravit) : null;
  if (params.upravit && !editRow) notFound();

  const [rows, projektyZakazky, pracovnici, zakaznici, editProjekty, rozpracovaneVykazy, projektyProModal, defaultPracovnik] =
    await Promise.all([
      listPrace({
        mesic: filters.mesic,
        pracovnikIds: filters.pracovnikIds,
        projektZakazky: filters.projektZakazky,
        zakaznikIds: filters.zakaznikIds,
        stavFakturace: filters.stav,
      }),
      listDistinctProjektZakazky(),
      listPracovnikOptions(),
      listZakaznikOptions(),
      editRow ? listProjektOptions(editRow.zakaznik_id) : Promise.resolve([]),
      listRozpracovaneVykazy(),
      listProjektOptions(),
      session ? getPracovnikIdByEmail(session.email) : Promise.resolve(null),
    ]);

  const filterQuery = praceFiltersToQuery(filters);
  const totals = summarizePrace(rows);
  const summary = { ...totals, count: rows.length };

  return (
    <AppShell
      title="Odvedená práce"
      actions={
        <NovaPraceModalTrigger
          projekty={projektyProModal}
          pracovnici={pracovnici}
          defaultOpen={params.nova === "1"}
          defaultProjekt={params.projekt?.split(",")[0] ?? ""}
          defaultPracovnik={defaultPracovnik ?? ""}
        />
      }
    >
      <div className="space-y-4 mb-6">
        <Suspense fallback={null}>
          <PraceFilters
            filters={filters}
            pracovnici={pracovnici}
            projekty={projektyZakazky}
            zakaznici={zakaznici.map((z) => ({ id: z.id, label: z.nazev }))}
            summary={summary}
          />
        </Suspense>
      </div>

      <UpravitPraceModal editRow={editRow} projekty={editProjekty} pracovnici={pracovnici} />

      {rows.length === 0 ? (
        <EmptyState message="Pro zvolené filtry nejsou žádné záznamy." />
      ) : (
        <PraceTable
          rows={rows}
          returnQuery={filterQuery}
          obdobi={filters.mesic}
          rozpracovaneVykazy={rozpracovaneVykazy}
        />
      )}
    </AppShell>
  );
}
