import { redirect } from "next/navigation";

export default async function SluzbaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sluzby?upravit=${id}`);
}
