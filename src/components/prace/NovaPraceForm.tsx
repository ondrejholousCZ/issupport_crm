"use client";

import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormGrid, FormSelect, FormTextarea } from "@/components/ui/FormField";
import { createPraceAction } from "@/lib/actions/prace";
import { todayIso } from "@/lib/format";
import { druhCinnostiLabels, stavFakturaceLabels } from "@/lib/labels";
import { CasInput } from "./CasInput";
import { MultiDatePicker } from "./MultiDatePicker";

type Option = { id: string; label: string };

export function NovaPraceForm({
  projekty,
  pracovnici,
  defaultProjekt = "",
  defaultPracovnik = "",
  onCancel,
}: {
  projekty: Option[];
  pracovnici: Option[];
  defaultProjekt?: string;
  defaultPracovnik?: string;
  onCancel: () => void;
}) {
  return (
    <form action={createPraceAction} className="space-y-4">
      <FormGrid>
        <MultiDatePicker defaultValue={todayIso()} />
        <FormSelect
          label="Projekt"
          name="projekt_id"
          required
          defaultValue={defaultProjekt}
          options={[
            { value: "", label: "— vyberte —" },
            ...projekty.map((p) => ({ value: p.id, label: p.label })),
          ]}
        />
        <FormSelect
          label="Pracovník"
          name="pracovnik_id"
          required
          defaultValue={defaultPracovnik}
          options={[
            { value: "", label: "— vyberte —" },
            ...pracovnici.map((p) => ({ value: p.id, label: p.label })),
          ]}
        />
        <FormSelect
          label="Druh činnosti"
          name="druh_cinnosti"
          defaultValue="prace"
          options={Object.entries(druhCinnostiLabels).map(([value, label]) => ({ value, label }))}
        />
        <CasInput />
        <FormSelect
          label="Stav fakturace"
          name="stav_fakturace"
          defaultValue="nefakturovano"
          options={Object.entries(stavFakturaceLabels).map(([value, label]) => ({ value, label }))}
        />
      </FormGrid>
      <FormTextarea label="Popis" name="popis" />
      <div className="flex gap-2 pt-2">
        <SubmitButton>Uložit</SubmitButton>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušit
        </Button>
      </div>
    </form>
  );
}
