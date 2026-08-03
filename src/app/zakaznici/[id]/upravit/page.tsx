import { redirect } from "next/navigation";

export default async function UpravitZakaznikPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/zakaznici/${id}?upravit=1`);
}
