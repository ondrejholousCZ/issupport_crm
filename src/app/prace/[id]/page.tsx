import { redirect } from "next/navigation";

export default async function PraceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/prace?upravit=${id}`);
}
