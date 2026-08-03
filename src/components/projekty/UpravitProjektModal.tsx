"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteProjektAction, updateProjektAction } from "@/lib/actions/projekt";
import type { Projekt } from "@/lib/types";
import { ProjektForm } from "./ProjektForm";

type ZakaznikOption = { id: string; nazev: string };

export function UpravitProjektModal({
  editRow,
  zakaznici,
  returnPath,
}: {
  editRow: Projekt | null;
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

  const update = updateProjektAction.bind(null, editRow.id);

  return (
    <DraggableModal
      open={open}
      onClose={close}
      title={`Upravit: ${editRow.nazev_projektu}`}
      closeOnBackdropClick={false}
    >
      <ProjektForm
        action={update}
        zakaznici={zakaznici}
        onCancel={close}
        defaultValues={{
          nazev_projektu: editRow.nazev_projektu,
          zakazka: editRow.zakazka ?? "",
          zakaznik_id: editRow.zakaznik_id,
          datum_od: editRow.datum_od ?? "",
          datum_do: editRow.datum_do ?? "",
          hodinova_sazba_fak: editRow.hodinova_sazba_fak ?? "",
          mena: editRow.mena,
          stav: editRow.stav,
        }}
      />
      <div className="mt-4 border-t border-border pt-4">
        <DeleteForm action={deleteProjektAction.bind(null, editRow.id)} />
      </div>
    </DraggableModal>
  );
}
