import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NovaPraceModalTrigger } from "@/components/prace/NovaPraceModal";
import { PraceTable } from "@/components/prace/PraceTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth/require-session";
import { listPracovnikOptions } from "@/lib/queries/pracovnik";
import { listProjektOptions } from "@/lib/queries/projekt";
import { listPrace } from "@/lib/queries/prace";

export default async function PracePage({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; zakaznik?: string; projekt?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const [rows, projekty, pracovnici] = await Promise.all([
    listPrace(),
    listProjektOptions(params.zakaznik),
    listPracovnikOptions(),
  ]);

  return (
    <AppShell
      title="Odvedená práce"
      actions={
        <NovaPraceModalTrigger
          projekty={projekty}
          pracovnici={pracovnici}
          defaultOpen={params.nova === "1"}
          defaultProjekt={params.projekt ?? ""}
        />
      }
    >
      {rows.length === 0 ? (
        <EmptyState message="Zatím nemáte žádné záznamy odvedené práce." />
      ) : (
        <PraceTable rows={rows} />
      )}
    </AppShell>
  );
}
