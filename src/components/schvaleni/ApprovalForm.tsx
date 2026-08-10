"use client";

import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormTextarea } from "@/components/ui/FormField";
import { approveVykazPublicAction } from "@/lib/actions/vykaz-prace";

export function ApprovalForm({ token }: { token: string }) {
  const action = approveVykazPublicAction.bind(null, token);

  return (
    <form action={action} className="space-y-4 border-t border-border pt-4">
      <FormTextarea label="Poznámka (volitelné)" name="poznamka" rows={3} />
      <SubmitButton>Schválit výkaz</SubmitButton>
    </form>
  );
}
