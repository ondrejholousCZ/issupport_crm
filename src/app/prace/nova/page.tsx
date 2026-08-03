import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";

export default async function NovaPracePage({
  searchParams,
}: {
  searchParams: Promise<{ zakaznik?: string; projekt?: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const params = await searchParams;
  const qs = new URLSearchParams({ nova: "1" });
  if (params.zakaznik) qs.set("zakaznik", params.zakaznik);
  if (params.projekt) qs.set("projekt", params.projekt);
  redirect(`/prace?${qs.toString()}`);
}
