import { redirect } from "next/navigation";

export default async function PracovnikDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/pracovnici?upravit=${id}`);
}
