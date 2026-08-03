import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FakturaceTimelineView, TimelineLegend } from "@/components/faktury/FakturaceTimeline";
import { FakturySubnav } from "@/components/faktury/FakturySubnav";
import { requireSession } from "@/lib/auth/require-session";
import { buildFakturaceTimeline } from "@/lib/queries/fakturace-timeline";

export default async function FakturyTimelinePage() {
  if (!(await requireSession())) redirect("/login");

  const timeline = await buildFakturaceTimeline();

  return (
    <AppShell title="Faktury — Timeline">
      <FakturySubnav />
      <TimelineLegend />
      <FakturaceTimelineView timeline={timeline} />
    </AppShell>
  );
}
