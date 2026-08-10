import Link from "next/link";
import { auth, signOut } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";

const navItems = [
  { href: "/", label: "Přehled" },
  { href: "/zakaznici", label: "Zákazníci" },
  { href: "/projekty", label: "Projekty" },
  { href: "/prace", label: "Odvedená práce" },
  { href: "/vykazy", label: "Výkazy práce" },
  { href: "/faktury", label: "Faktury" },
  { href: "/sluzby", label: "Služby" },
  { href: "/pracovnici", label: "Pracovníci" },
];

export async function AppShell({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-sidebar text-sidebar-text flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-wider opacity-60">issupport</p>
          <h1 className="text-lg font-semibold text-white mt-1">ISSP CRM</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-sm">
          <p className="text-white truncate">{user?.name ?? user?.email ?? "Uživatel"}</p>
          {user?.role && <p className="text-xs opacity-60 mt-0.5">{user.role}</p>}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-0"
          >
            <SignOutButton />
          </form>
        </div>
      </aside>

      <main className="flex-1 min-h-screen pt-8 px-8 pb-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
