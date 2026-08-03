import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PraceTable } from "@/components/prace/PraceTable";
import { PraceToolbar } from "@/components/prace/PraceToolbar";
import { UpravitPraceModal } from "@/components/prace/UpravitPraceModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth/require-session";
import { listPracovnikOptions } from "@/lib/queries/pracovnik";
import { listProjektOptions } from "@/lib/queries/projekt";
import { getPrace, listPrace } from "@/lib/queries/prace";

export default async function PracePage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; upravit?: string; zakaznik?: string; projekt?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;

  const editRow = params.upravit ? await getPrace(params.upravit) : null;
  if (params.upravit && !editRow) notFound();

  const [rows, projekty, pracovnici, editProjekty] = await Promise.all([
    listPrace(),
    listProjektOptions(params.zakaznik),
    listPracovnikOptions(),
    editRow ? listProjektOptions(editRow.zakaznik_id) : Promise.resolve([]),
  ]);

  return (
    <AppShell
      title="Odvedená práce"
      actions={
        <PraceToolbar
          projekty={projekty}
          pracovnici={pracovnici}
          defaultOpenNova={params.nova === "1"}
          defaultProjekt={params.projekt ?? ""}
        />
      }
    >
      <UpravitPraceModal editRow={editRow} projekty={editProjekty} pracovnici={pracovnici} />
      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné záznamy odvedené práce." />
      ) : (
        <PraceTable rows={rows} />
      )}
    </AppShell>
  );
}
