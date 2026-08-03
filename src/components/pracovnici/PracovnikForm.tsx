"use client";

import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { pracovnikTypLabels } from "@/lib/labels";

export type PracovnikFormValues = {
  jmeno?: string;
  prijmeni?: string;
  email?: string;
  typ?: string;
  naklad_na_hodinu?: string;
  mena?: string;
  sazba_platna_od?: string;
};

export function PracovnikForm({
  action,
  onCancel,
  defaultValues = {},
}: {
  action: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: PracovnikFormValues;
}) {
  return (
    <form action={action} className="space-y-4">
      <FormGrid>
        <FormField label="Jméno" name="jmeno" required defaultValue={defaultValues.jmeno ?? ""} />
        <FormField label="Příjmení" name="prijmeni" required defaultValue={defaultValues.prijmeni ?? ""} />
        <FormField label="E-mail" name="email" type="email" defaultValue={defaultValues.email ?? ""} />
        <FormSelect
          label="Typ"
          name="typ"
          defaultValue={defaultValues.typ ?? "zamestnanec"}
          options={Object.entries(pracovnikTypLabels).map(([value, label]) => ({ value, label }))}
        />
        <FormField
          label="Náklad na hodinu"
          name="naklad_na_hodinu"
          type="number"
          step="0.01"
          defaultValue={defaultValues.naklad_na_hodinu ?? ""}
        />
        <FormField label="Měna" name="mena" defaultValue={defaultValues.mena ?? "CZK"} />
        <FormField
          label="Sazba platná od"
          name="sazba_platna_od"
          type="date"
          defaultValue={defaultValues.sazba_platna_od ?? ""}
        />
      </FormGrid>
      <div className="flex gap-2 pt-2">
        <SubmitButton>Uložit</SubmitButton>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušit
        </Button>
      </div>
    </form>
  );
}
