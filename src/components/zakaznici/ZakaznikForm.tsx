"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, FormGrid, FormSelect, FormTextarea } from "@/components/ui/FormField";
import { zakaznikStavLabels } from "@/lib/labels";

type ZakaznikFormValues = {
  nazev?: string;
  ico?: string;
  ic_dph?: string;
  stav?: string;
  kontaktni_email?: string;
  kontaktni_telefon?: string;
  fakturacni_ulice?: string;
  fakturacni_mesto?: string;
  fakturacni_psc?: string;
  postup_fakturace?: string;
};

export function ZakaznikForm({
  action,
  submitLabel = "Uložit",
  cancelHref,
  defaultValues = {},
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  cancelHref: string;
  defaultValues?: ZakaznikFormValues;
}) {
  const [ico, setIco] = useState(defaultValues.ico ?? "");
  const [nazev, setNazev] = useState(defaultValues.nazev ?? "");
  const [fakturacniUlice, setFakturacniUlice] = useState(defaultValues.fakturacni_ulice ?? "");
  const [fakturacniMesto, setFakturacniMesto] = useState(defaultValues.fakturacni_mesto ?? "");
  const [fakturacniPsc, setFakturacniPsc] = useState(defaultValues.fakturacni_psc ?? "");
  const [lookupDone, setLookupDone] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetLoadedFields() {
    setLookupDone(false);
    if (!defaultValues.nazev) setNazev("");
    setFakturacniUlice(defaultValues.fakturacni_ulice ?? "");
    setFakturacniMesto(defaultValues.fakturacni_mesto ?? "");
    setFakturacniPsc(defaultValues.fakturacni_psc ?? "");
  }

  function handleIcoChange(value: string) {
    setIco(value);
    resetLoadedFields();
  }

  async function handleLookup() {
    setLookupLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/zakaznici/lookup-ico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ico }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        company?: {
          name: string;
          ico: string;
          street: string;
          city: string;
          postalCode: string;
        };
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "Údaje firmy se nepodařilo načíst.");
        return;
      }

      if (data?.company) {
        setIco(data.company.ico);
        setNazev(data.company.name);
        setFakturacniUlice(data.company.street);
        setFakturacniMesto(data.company.city);
        setFakturacniPsc(data.company.postalCode);
        setLookupDone(true);
      }
    } catch {
      setError("Údaje firmy se nepodařilo načíst. Zkontrolujte připojení.");
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">IČO</label>
        <div className="flex gap-2">
          <input
            name="ico"
            inputMode="numeric"
            value={ico}
            onChange={(e) => handleIcoChange(e.target.value)}
            placeholder="12345678"
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupLoading || !ico.trim()}
            className="shrink-0 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {lookupLoading ? "Načítám…" : "Načti z DAIS"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Vyplní název a fakturační adresu z ARES.</p>
      </div>

      <FormGrid>
        <FormField label="Název" name="nazev" required value={nazev} onChange={(e) => setNazev(e.target.value)} />
        <FormField
          label="IČ DPH"
          name="ic_dph"
          defaultValue={defaultValues.ic_dph ?? ""}
        />
        <FormSelect
          label="Stav"
          name="stav"
          defaultValue={defaultValues.stav ?? "aktivni"}
          options={Object.entries(zakaznikStavLabels).map(([value, label]) => ({ value, label }))}
        />
        <FormField
          label="Kontaktní e-mail"
          name="kontaktni_email"
          type="email"
          defaultValue={defaultValues.kontaktni_email ?? ""}
        />
        <FormField
          label="Telefon"
          name="kontaktni_telefon"
          defaultValue={defaultValues.kontaktni_telefon ?? ""}
        />
        <FormField
          label="Ulice"
          name="fakturacni_ulice"
          value={fakturacniUlice}
          onChange={(e) => setFakturacniUlice(e.target.value)}
        />
        <FormField
          label="Město"
          name="fakturacni_mesto"
          value={fakturacniMesto}
          onChange={(e) => setFakturacniMesto(e.target.value)}
        />
        <FormField
          label="PSČ"
          name="fakturacni_psc"
          value={fakturacniPsc}
          onChange={(e) => setFakturacniPsc(e.target.value)}
        />
      </FormGrid>

      <FormTextarea
        label="Postup fakturace"
        name="postup_fakturace"
        defaultValue={defaultValues.postup_fakturace ?? ""}
      />

      {lookupDone ? (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Údaje načteny z DAIS — před uložením je můžete ještě upravit.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit">{submitLabel}</Button>
        <Button href={cancelHref} variant="secondary">
          Zrušit
        </Button>
      </div>
    </form>
  );
}
