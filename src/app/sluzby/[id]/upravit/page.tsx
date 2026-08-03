import { redirect } from "next/navigation";

export default async function UpravitSluzbuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sluzby/${id}?upravit=1`);
}
