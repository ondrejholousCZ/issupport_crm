import { MicrosoftLoginButton } from "@/components/auth/MicrosoftLoginButton";
import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-sm border border-border p-8">
        <p className="text-xs uppercase tracking-wider text-gray-500">issupport</p>
        <h1 className="text-2xl font-semibold mt-1 mb-2">ISSP CRM</h1>
        <p className="text-sm text-gray-500 mb-8">
          Přihlaste se firemním účtem Microsoft (Entra ID).
        </p>

        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            Přihlášení se nezdařilo. Ověřte, že máte přiřazený přístup k aplikaci v Entra ID.
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", {
              redirectTo: params.callbackUrl ?? "/",
            });
          }}
        >
          <MicrosoftLoginButton />
        </form>
      </div>
    </div>
  );
}
