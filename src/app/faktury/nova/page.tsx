import { redirect } from "next/navigation";

export default async function NovaFakturaPage({
  searchParams,
}: {
  searchParams: Promise<{ zakaznik?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ nova: "1" });
  if (params.zakaznik) qs.set("zakaznik", params.zakaznik);
  redirect(`/faktury?${qs}`);
}
