import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { FakturaceTimelineView, TimelineLegend } from "@/components/faktury/FakturaceTimeline";
import { FakturySubnav } from "@/components/faktury/FakturySubnav";
import { UpravitFakturaModal } from "@/components/faktury/UpravitFakturaModal";
import { requireSession } from "@/lib/auth/require-session";
import { buildFakturaceTimeline } from "@/lib/queries/fakturace-timeline";
import { getFaktura } from "@/lib/queries/faktura";
import { listProjektOptions } from "@/lib/queries/projekt";
import { listSluzbaOptions } from "@/lib/queries/sluzba";
import { listZakaznikOptions } from "@/lib/queries/zakaznik";

export default async function FakturyTimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ upravit?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;

  const [timeline, zakaznici, projekty, sluzby, editRow] = await Promise.all([
    buildFakturaceTimeline(),
    listZakaznikOptions(),
    listProjektOptions(),
    listSluzbaOptions(),
    params.upravit ? getFaktura(params.upravit) : Promise.resolve(null),
  ]);
  if (params.upravit && !editRow) notFound();

  return (
    <AppShell title="Faktury — Timeline">
      <FakturySubnav />
      <Suspense fallback={null}>
        <UpravitFakturaModal
          editRow={editRow}
          zakaznici={zakaznici}
          projekty={projekty}
          sluzby={sluzby}
          returnPath="/faktury/timeline"
        />
      </Suspense>
      <TimelineLegend />
      <FakturaceTimelineView timeline={timeline} />
    </AppShell>
  );
}
