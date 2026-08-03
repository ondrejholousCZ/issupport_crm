"use client";

import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { projektStavLabels } from "@/lib/labels";

export type ProjektFormValues = {
  nazev_projektu?: string;
  zakazka?: string;
  zakaznik_id?: string;
  datum_od?: string;
  datum_do?: string;
  hodinova_sazba_fak?: string;
  mena?: string;
  stav?: string;
};

type ZakaznikOption = { id: string; nazev: string };

export function ProjektForm({
  action,
  zakaznici,
  onCancel,
  defaultValues = {},
}: {
  action: (formData: FormData) => Promise<void>;
  zakaznici: ZakaznikOption[];
  onCancel: () => void;
  defaultValues?: ProjektFormValues;
}) {
  return (
    <form action={action} className="space-y-4">
      <FormGrid>
        <FormField
          label="Název projektu"
          name="nazev_projektu"
          required
          defaultValue={defaultValues.nazev_projektu ?? ""}
        />
        <FormField
          label="Zkrácený název (zakázka)"
          name="zakazka"
          defaultValue={defaultValues.zakazka ?? ""}
          placeholder="např. PGRLF, Gerkin"
          hint="Krátký kód pro sloupec Zakázka ve výkazu práce (Excel)"
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
        <FormField label="Datum od" name="datum_od" type="date" defaultValue={defaultValues.datum_od ?? ""} />
        <FormField label="Datum do" name="datum_do" type="date" defaultValue={defaultValues.datum_do ?? ""} />
        <FormField
          label="Hodinová sazba fakturace"
          name="hodinova_sazba_fak"
          type="number"
          step="0.01"
          defaultValue={defaultValues.hodinova_sazba_fak ?? ""}
        />
        <FormField label="Měna" name="mena" defaultValue={defaultValues.mena ?? "CZK"} />
        <FormSelect
          label="Stav"
          name="stav"
          defaultValue={defaultValues.stav ?? "aktivni"}
          options={Object.entries(projektStavLabels).map(([value, label]) => ({ value, label }))}
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
