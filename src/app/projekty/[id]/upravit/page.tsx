import { redirect } from "next/navigation";

export default async function UpravitProjektPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projekty?upravit=${id}`);
}
