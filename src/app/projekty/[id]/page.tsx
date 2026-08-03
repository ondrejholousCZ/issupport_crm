import { redirect } from "next/navigation";

export default async function ProjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projekty?upravit=${id}`);
}
