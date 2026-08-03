"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField, FormGrid, FormSelect } from "@/components/ui/FormField";
import { fakturaStavLabels, fakturaTypLabels } from "@/lib/labels";

export type FakturaFormValues = {
  cislo_faktury?: string;
  zakaznik_id?: string;
  projekt_id?: string;
  sluzba_id?: string;
  datum_vystaveni?: string;
  datum_splatnosti?: string;
  datum_uhrazeni?: string;
  castka_bez_dph?: string;
  dph_sazba?: string;
  castka_celkem?: string;
  stav?: string;
  typ_faktury?: string;
  external_ref?: string;
};

type ZakaznikOption = { id: string; nazev: string };
type LinkedOption = { id: string; label: string; zakaznik_id: string };

export function FakturaForm({
  action,
  zakaznici,
  projekty,
  sluzby,
  onCancel,
  defaultValues = {},
}: {
  action: (formData: FormData) => Promise<void>;
  zakaznici: ZakaznikOption[];
  projekty: LinkedOption[];
  sluzby: LinkedOption[];
  onCancel: () => void;
  defaultValues?: FakturaFormValues;
}) {
  const [zakaznikId, setZakaznikId] = useState(defaultValues.zakaznik_id ?? "");

  const projektOptions = useMemo(
    () => (zakaznikId ? projekty.filter((p) => p.zakaznik_id === zakaznikId) : []),
    [projekty, zakaznikId],
  );
  const sluzbaOptions = useMemo(
    () => (zakaznikId ? sluzby.filter((s) => s.zakaznik_id === zakaznikId) : []),
    [sluzby, zakaznikId],
  );

  return (
    <form action={action} className="space-y-4">
      <FormGrid>
        <FormField
          label="Číslo faktury"
          name="cislo_faktury"
          defaultValue={defaultValues.cislo_faktury ?? ""}
        />
        <FormSelect
          label="Zákazník"
          name="zakaznik_id"
          required
          defaultValue={defaultValues.zakaznik_id ?? ""}
          onChange={(e) => setZakaznikId(e.target.value)}
          options={[
            { value: "", label: "— vyberte —" },
            ...zakaznici.map((z) => ({ value: z.id, label: z.nazev })),
          ]}
        />
        <FormSelect
          label="Projekt"
          name="projekt_id"
          defaultValue={defaultValues.projekt_id ?? ""}
          options={[
            { value: "", label: "—" },
            ...projektOptions.map((p) => ({ value: p.id, label: p.label })),
          ]}
        />
        <FormSelect
          label="Služba"
          name="sluzba_id"
          defaultValue={defaultValues.sluzba_id ?? ""}
          options={[
            { value: "", label: "—" },
            ...sluzbaOptions.map((s) => ({ value: s.id, label: s.label })),
          ]}
        />
        <FormField
          label="Datum vystavení"
          name="datum_vystaveni"
          type="date"
          defaultValue={defaultValues.datum_vystaveni ?? ""}
        />
        <FormField
          label="Datum splatnosti"
          name="datum_splatnosti"
          type="date"
          defaultValue={defaultValues.datum_splatnosti ?? ""}
        />
        <FormField
          label="Datum úhrady"
          name="datum_uhrazeni"
          type="date"
          defaultValue={defaultValues.datum_uhrazeni ?? ""}
        />
        <FormField
          label="Částka bez DPH"
          name="castka_bez_dph"
          type="number"
          step="0.01"
          defaultValue={defaultValues.castka_bez_dph ?? ""}
        />
        <FormField
          label="DPH %"
          name="dph_sazba"
          type="number"
          step="0.01"
          defaultValue={defaultValues.dph_sazba ?? "21"}
        />
        <FormField
          label="Celková částka"
          name="castka_celkem"
          type="number"
          step="0.01"
          defaultValue={defaultValues.castka_celkem ?? ""}
        />
        <FormSelect
          label="Stav"
          name="stav"
          defaultValue={defaultValues.stav ?? "rozpracovana"}
          options={Object.entries(fakturaStavLabels).map(([value, label]) => ({ value, label }))}
        />
        <FormSelect
          label="Typ faktury"
          name="typ_faktury"
          defaultValue={defaultValues.typ_faktury ?? ""}
          options={[
            { value: "", label: "—" },
            ...Object.entries(fakturaTypLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FormField
          label="External ref (FaktuMatch)"
          name="external_ref"
          defaultValue={defaultValues.external_ref ?? ""}
          hint="Pro budoucí napojení"
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
