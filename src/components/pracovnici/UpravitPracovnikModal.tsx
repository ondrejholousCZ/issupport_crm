"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { DeleteForm } from "@/components/DeleteForm";
import { deletePracovnikAction, updatePracovnikAction } from "@/lib/actions/pracovnik";
import type { Pracovnik } from "@/lib/types";
import { PracovnikForm } from "./PracovnikForm";

export function UpravitPracovnikModal({
  editRow,
  returnPath,
}: {
  editRow: Pracovnik | null;
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

  const update = updatePracovnikAction.bind(null, editRow.id);

  return (
    <DraggableModal
      open={open}
      onClose={close}
      title={`Upravit: ${editRow.prijmeni} ${editRow.jmeno}`}
      closeOnBackdropClick={false}
    >
      <PracovnikForm
        action={update}
        onCancel={close}
        defaultValues={{
          jmeno: editRow.jmeno,
          prijmeni: editRow.prijmeni,
          email: editRow.email ?? "",
          typ: editRow.typ,
          naklad_na_hodinu: editRow.naklad_na_hodinu ?? "",
          mena: editRow.mena,
          sazba_platna_od: editRow.sazba_platna_od ?? "",
        }}
      />
      <div className="mt-4 border-t border-border pt-4">
        <DeleteForm action={deletePracovnikAction.bind(null, editRow.id)} />
      </div>
    </DraggableModal>
  );
}
