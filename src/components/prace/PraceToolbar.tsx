"use client";

import { NovaPraceModalTrigger } from "./NovaPraceModal";
import { PraceExportForm } from "./PraceExportForm";

type Option = { id: string; label: string };

export function PraceToolbar({
  projekty,
  pracovnici,
  defaultOpenNova = false,
  defaultProjekt = "",
}: {
  projekty: Option[];
  pracovnici: Option[];
  defaultOpenNova?: boolean;
  defaultProjekt?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <NovaPraceModalTrigger
        projekty={projekty}
        pracovnici={pracovnici}
        defaultOpen={defaultOpenNova}
        defaultProjekt={defaultProjekt}
      />
      <PraceExportForm pracovnici={pracovnici} />
    </div>
  );
}
