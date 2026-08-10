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
import { listDistinctProjektNazvy, listProjektOptions } from "@/lib/queries/projekt";
import { listPracovnikOptions } from "@/lib/queries/pracovnik";
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
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const filters = parsePraceFilters(params);

  const editRow = params.upravit ? await getPrace(params.upravit) : null;
  if (params.upravit && !editRow) notFound();

  const [rows, projektyNazvy, pracovnici, zakaznici, editProjekty, rozpracovaneVykazy, projektyProModal] =
    await Promise.all([
      listPrace({
        mesic: filters.mesic,
        pracovnikIds: filters.pracovnikIds,
        projektNazvy: filters.projektNazvy,
        zakaznikIds: filters.zakaznikIds,
        stavFakturace: filters.stav,
      }),
      listDistinctProjektNazvy(),
      listPracovnikOptions(),
      listZakaznikOptions(),
      editRow ? listProjektOptions(editRow.zakaznik_id) : Promise.resolve([]),
      listRozpracovaneVykazy(),
      listProjektOptions(),
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
        />
      }
    >
      <div className="space-y-4 mb-6">
        <Suspense fallback={null}>
          <PraceFilters
            filters={filters}
            pracovnici={pracovnici}
            projekty={projektyNazvy}
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
