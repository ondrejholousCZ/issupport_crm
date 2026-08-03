"use client";

import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField, FormGrid, FormSelect, FormTextarea } from "@/components/ui/FormField";
import { updatePraceAction } from "@/lib/actions/prace";
import { formatCasInput } from "@/lib/cas";
import { druhCinnostiLabels, stavFakturaceLabels } from "@/lib/labels";
import type { OdvedenaPrace } from "@/lib/types";
import { CasInput } from "./CasInput";

type Option = { id: string; label: string };

export function UpravitPraceForm({
  row,
  projekty,
  pracovnici,
  onCancel,
}: {
  row: OdvedenaPrace;
  projekty: Option[];
  pracovnici: Option[];
  onCancel: () => void;
}) {
  const update = updatePraceAction.bind(null, row.id);

  return (
    <form action={update} className="space-y-4">
      <input type="hidden" name="zakaznik_id" value={row.zakaznik_id} />
      <FormGrid>
        <FormField label="Datum" name="datum" type="date" required defaultValue={row.datum.slice(0, 10)} />
        <FormSelect
          label="Projekt"
          name="projekt_id"
          required
          defaultValue={row.projekt_id}
          options={projekty.map((p) => ({ value: p.id, label: p.label }))}
        />
        <FormSelect
          label="Pracovník"
          name="pracovnik_id"
          required
          defaultValue={row.pracovnik_id}
          options={pracovnici.map((p) => ({ value: p.id, label: p.label }))}
        />
        <FormSelect
          label="Druh činnosti"
          name="druh_cinnosti"
          defaultValue={row.druh_cinnosti ?? "prace"}
          options={Object.entries(druhCinnostiLabels).map(([value, label]) => ({ value, label }))}
        />
        <CasInput defaultValue={formatCasInput(row.hodiny, row.minuty)} />
        <FormSelect
          label="Stav fakturace"
          name="stav_fakturace"
          defaultValue={row.stav_fakturace}
          options={Object.entries(stavFakturaceLabels).map(([value, label]) => ({ value, label }))}
        />
      </FormGrid>
      <FormTextarea label="Popis" name="popis" defaultValue={row.popis ?? ""} />
      <div className="flex gap-2 pt-2">
        <SubmitButton>Uložit</SubmitButton>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušit
        </Button>
      </div>
    </form>
  );
}
