"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { updateZakaznikAction } from "@/lib/actions/zakaznik";
import type { Zakaznik } from "@/lib/types";
import { ZakaznikForm } from "./ZakaznikForm";

export function UpravitZakaznikModal({
  editRow,
  returnPath,
}: {
  editRow: Zakaznik | null;
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

  const update = updateZakaznikAction.bind(null, editRow.id);

  return (
    <DraggableModal
      open={open}
      onClose={close}
      title={`Upravit: ${editRow.nazev}`}
      closeOnBackdropClick={false}
    >
      <ZakaznikForm
        action={update}
        submitLabel="Uložit"
        onCancel={close}
        defaultValues={{
          nazev: editRow.nazev,
          ico: editRow.ico ?? "",
          zkratka: editRow.zkratka ?? "",
          stav: editRow.stav,
          kontaktni_email: editRow.kontaktni_email ?? "",
          kontaktni_telefon: editRow.kontaktni_telefon ?? "",
          fakturacni_ulice: editRow.fakturacni_ulice ?? "",
          fakturacni_mesto: editRow.fakturacni_mesto ?? "",
          fakturacni_psc: editRow.fakturacni_psc ?? "",
          postup_fakturace: editRow.postup_fakturace ?? "",
        }}
      />
    </DraggableModal>
  );
}
