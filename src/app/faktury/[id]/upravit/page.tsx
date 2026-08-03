import { redirect } from "next/navigation";

export default async function UpravitFakturuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/faktury?upravit=${id}`);
}
