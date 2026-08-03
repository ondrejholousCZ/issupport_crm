"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteSluzbaAction, updateSluzbaAction } from "@/lib/actions/sluzba";
import type { Sluzba } from "@/lib/types";
import { SluzbaForm } from "./SluzbaForm";

type ZakaznikOption = { id: string; nazev: string };

export function UpravitSluzbaModal({
  editRow,
  zakaznici,
  returnPath,
}: {
  editRow: Sluzba | null;
  zakaznici: ZakaznikOption[];
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

  const update = updateSluzbaAction.bind(null, editRow.id);

  return (
    <DraggableModal
      open={open}
      onClose={close}
      title={`Upravit: ${editRow.nazev_sluzby}`}
      closeOnBackdropClick={false}
    >
      <SluzbaForm
        action={update}
        zakaznici={zakaznici}
        onCancel={close}
        defaultValues={{
          nazev_sluzby: editRow.nazev_sluzby,
          zakaznik_id: editRow.zakaznik_id,
          frekvence: editRow.frekvence ?? "mesicne",
          frekvence_dnu: editRow.frekvence_dnu,
          cena_periody: editRow.cena_periody ?? "",
          mena: editRow.mena,
          posledni_platba: editRow.posledni_platba ?? "",
          stav: editRow.stav,
        }}
      />
      <div className="mt-4 border-t border-border pt-4">
        <DeleteForm action={deleteSluzbaAction.bind(null, editRow.id)} />
      </div>
    </DraggableModal>
  );
}
