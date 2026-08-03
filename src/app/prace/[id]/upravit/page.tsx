import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getPrace } from "@/lib/queries/prace";

export default async function UpravitPracePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireSession())) redirect("/login");
  const { id } = await params;
  const row = await getPrace(id);
  if (!row) notFound();
  redirect(`/prace?upravit=${id}`);
}
