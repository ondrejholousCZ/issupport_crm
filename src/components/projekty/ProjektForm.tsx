"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { projektJednotkaSazbyLabels, projektStavLabels } from "@/lib/labels";
import type { ProjektJednotkaSazby } from "@/lib/types";

export type ProjektFormValues = {
  nazev_projektu?: string;
  zakazka?: string;
  zakaznik_id?: string;
  datum_od?: string;
  datum_do?: string;
  hodinova_sazba_fak?: string;
  jednotka_sazby?: ProjektJednotkaSazby;
  mena?: string;
  stav?: string;
  faktura_text_sablona?: string;
  faktura_jednotka?: string;
  faktura_splatnost_dnu?: number;
  faktura_duzp_typ?: string;
  faktura_dph_sazba?: string;
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
  const [jednotka, setJednotka] = useState<ProjektJednotkaSazby>(
    defaultValues.jednotka_sazby ?? "hodina",
  );

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
        <FormSelect
          label="Jednotka sazby"
          name="jednotka_sazby"
          defaultValue={defaultValues.jednotka_sazby ?? "hodina"}
          options={Object.entries(projektJednotkaSazbyLabels).map(([value, label]) => ({
            value,
            label,
          }))}
          onChange={(e) => setJednotka(e.target.value as ProjektJednotkaSazby)}
        />
        <FormField
          label={jednotka === "md" ? "Sazba fakturace (Kč/MD)" : "Sazba fakturace (Kč/h)"}
          name="hodinova_sazba_fak"
          type="number"
          step="0.01"
          defaultValue={defaultValues.hodinova_sazba_fak ?? ""}
          hint={jednotka === "md" ? "Práce se zadává v hodinách, fakturace se počítá v MD (1 MD = 8 h)" : undefined}
        />
        <FormField label="Měna" name="mena" defaultValue={defaultValues.mena ?? "CZK"} />
        <FormSelect
          label="Stav"
          name="stav"
          defaultValue={defaultValues.stav ?? "aktivni"}
          options={Object.entries(projektStavLabels).map(([value, label]) => ({ value, label }))}
        />
      </FormGrid>

      <div className="border-t border-border pt-4 space-y-3">
        <h3 className="text-sm font-semibold">Fakturační šablona (iDoklad)</h3>
        <p className="text-xs text-gray-500">
          Placeholdery: {"{zakazka}"}, {"{mesic}"}, {"{rok}"}, {"{obdobi}"}
        </p>
        <FormGrid>
          <FormField
            label="Text položky faktury"
            name="faktura_text_sablona"
            defaultValue={defaultValues.faktura_text_sablona ?? "{zakazka} - Servisní práce za {mesic}/{rok}"}
          />
          <FormSelect
            label="Jednotka na faktuře"
            name="faktura_jednotka"
            defaultValue={defaultValues.faktura_jednotka ?? "md"}
            options={[
              { value: "md", label: "MD (dny)" },
              { value: "hodina", label: "Hodiny" },
              { value: "ks", label: "Ks" },
            ]}
          />
          <FormField
            label="Splatnost (dní od DUZP)"
            name="faktura_splatnost_dnu"
            type="number"
            defaultValue={String(defaultValues.faktura_splatnost_dnu ?? 30)}
          />
          <FormSelect
            label="DUZP"
            name="faktura_duzp_typ"
            defaultValue={defaultValues.faktura_duzp_typ ?? "konec_obdobi"}
            options={[
              { value: "konec_obdobi", label: "Poslední den období výkazu" },
              { value: "vystaveni", label: "Datum vystavení" },
            ]}
          />
          <FormField
            label="DPH %"
            name="faktura_dph_sazba"
            type="number"
            step="0.01"
            defaultValue={defaultValues.faktura_dph_sazba ?? "21"}
          />
        </FormGrid>
      </div>

      <div className="flex gap-2 pt-2">
        <SubmitButton>Uložit</SubmitButton>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušit
        </Button>
      </div>
    </form>
  );
}
