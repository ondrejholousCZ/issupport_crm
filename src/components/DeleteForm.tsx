"use client";

import { Button } from "@/components/ui/Button";

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
      <Button type="submit" variant="danger">
        {label}
      </Button>
    </form>
  );
}
