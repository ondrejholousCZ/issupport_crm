"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteFakturaAction, updateFakturaAction } from "@/lib/actions/faktura";
import type { Faktura } from "@/lib/types";
import { FakturaForm } from "./FakturaForm";

type ZakaznikOption = { id: string; nazev: string };
type LinkedOption = { id: string; label: string; zakaznik_id: string };

export function UpravitFakturaModal({
  editRow,
  zakaznici,
  projekty,
  sluzby,
  returnPath,
}: {
  editRow: Faktura | null;
  zakaznici: ZakaznikOption[];
  projekty: LinkedOption[];
  sluzby: LinkedOption[];
  returnPath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(Boolean(editRow));

  useEffect(() => {
    setOpen(Boolean(editRow));
  }, [editRow]);

  const close = useCallback(() => {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("upravit");
    const qs = params.toString();
    router.replace(qs ? `${returnPath}?${qs}` : returnPath, { scroll: false });
  }, [router, searchParams, returnPath]);

  if (!editRow) return null;

  const update = updateFakturaAction.bind(null, editRow.id);
  const title = editRow.cislo_faktury ? `Upravit: ${editRow.cislo_faktury}` : "Upravit fakturu";

  return (
    <DraggableModal open={open} onClose={close} title={title} closeOnBackdropClick={false}>
      <FakturaForm
        action={update}
        zakaznici={zakaznici}
        projekty={projekty}
        sluzby={sluzby}
        onCancel={close}
        defaultValues={{
          cislo_faktury: editRow.cislo_faktury ?? "",
          zakaznik_id: editRow.zakaznik_id,
          projekt_id: editRow.projekt_id ?? "",
          sluzba_id: editRow.sluzba_id ?? "",
          datum_vystaveni: editRow.datum_vystaveni ?? "",
          datum_splatnosti: editRow.datum_splatnosti ?? "",
          datum_uhrazeni: editRow.datum_uhrazeni ?? "",
          castka_bez_dph: editRow.castka_bez_dph ?? "",
          dph_sazba: editRow.dph_sazba ?? "21",
          castka_celkem: editRow.castka_celkem ?? "",
          stav: editRow.stav,
          typ_faktury: editRow.typ_faktury ?? "",
          external_ref: editRow.external_ref ?? editRow.idoklad_id?.toString() ?? "",
          idoklad_id: editRow.idoklad_id,
          idoklad_url: editRow.idoklad_url ?? "",
        }}
      />
      <div className="mt-4 border-t border-border pt-4">
        <DeleteForm action={deleteFakturaAction.bind(null, editRow.id)} />
      </div>
    </DraggableModal>
  );
}
