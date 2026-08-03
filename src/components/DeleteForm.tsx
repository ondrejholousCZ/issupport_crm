"use client";

import { SubmitButton } from "@/components/ui/SubmitButton";

export function DeleteForm({
  action,
  label = "Smazat",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Opravdu smazat tento záznam?")) e.preventDefault();
      }}
    >
      <SubmitButton variant="danger">
        {label}
      </SubmitButton>
    </form>
  );
}
