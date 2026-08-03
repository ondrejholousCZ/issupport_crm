import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { requireSession } from "@/lib/auth/require-session";
import { getDashboardStats } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  if (!(await requireSession())) redirect("/login");

  const stats = await getDashboardStats();

  const tiles = [
    { label: "Aktivní zákazníci", value: stats.zakaznici, href: "/zakaznici" },
    { label: "Aktivní projekty", value: stats.aktivni_projekty, href: "/projekty" },
    { label: "Nefakturovaná práce", value: stats.nefakturovana_prace, href: "/prace" },
    { label: "Služby k fakturaci (30 dní)", value: stats.sluzby_blizko_fakturace, href: "/sluzby" },
  ];

  return (
    <AppShell title="Přehled">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardBody>
                <p className="text-sm text-gray-500">{tile.label}</p>
                <p className="text-3xl font-semibold mt-2">{tile.value}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <Button href="/prace/nova">+ Nová odvedená práce</Button>
        <Button href="/zakaznici/novy" variant="secondary">
          + Nový zákazník
        </Button>
      </div>
    </AppShell>
  );
}
