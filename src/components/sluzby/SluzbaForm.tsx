"use client";

import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { sluzbaFrekvenceLabels, sluzbaStavLabels } from "@/lib/labels";

export type SluzbaFormValues = {
  nazev_sluzby?: string;
  zakaznik_id?: string;
  frekvence?: string;
  frekvence_dnu?: number | null;
  cena_periody?: string;
  mena?: string;
  posledni_platba?: string;
  stav?: string;
};

type ZakaznikOption = { id: string; nazev: string };

export function SluzbaForm({
  action,
  zakaznici,
  onCancel,
  defaultValues = {},
}: {
  action: (formData: FormData) => Promise<void>;
  zakaznici: ZakaznikOption[];
  onCancel: () => void;
  defaultValues?: SluzbaFormValues;
}) {
  return (
    <form action={action} className="space-y-4">
      <FormGrid>
        <FormField
          label="Název služby"
          name="nazev_sluzby"
          required
          defaultValue={defaultValues.nazev_sluzby ?? ""}
        />
        <FormSelect
          label="Zákazník"
          name="zakaznik_id"
          required
          defaultValue={defaultValues.zakaznik_id ?? ""}
          options={[
            { value: "", label: "— vyberte —" },
            ...zakaznici.map((z) => ({ value: z.id, label: z.nazev })),
          ]}
        />
        <FormSelect
          label="Frekvence"
          name="frekvence"
          defaultValue={defaultValues.frekvence ?? "mesicne"}
          options={Object.entries(sluzbaFrekvenceLabels).map(([value, label]) => ({ value, label }))}
        />
        <FormField
          label="Frekvence ve dnech"
          name="frekvence_dnu"
          type="number"
          defaultValue={defaultValues.frekvence_dnu ?? ""}
          hint="Vyplňte pouze u frekvence „Vlastní“"
        />
        <FormField
          label="Cena za období"
          name="cena_periody"
          type="number"
          step="0.01"
          defaultValue={defaultValues.cena_periody ?? ""}
        />
        <FormField label="Měna" name="mena" defaultValue={defaultValues.mena ?? "CZK"} />
        <FormField
          label="Poslední platba"
          name="posledni_platba"
          type="date"
          defaultValue={defaultValues.posledni_platba ?? ""}
          hint="Další fakturace se počítá na 1. den následujícího období (splatnost faktury 14 dní)."
        />
        <FormSelect
          label="Stav"
          name="stav"
          defaultValue={defaultValues.stav ?? "aktivni"}
          options={Object.entries(sluzbaStavLabels).map(([value, label]) => ({ value, label }))}
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
