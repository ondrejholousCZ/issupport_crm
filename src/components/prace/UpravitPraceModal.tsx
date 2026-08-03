"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import type { OdvedenaPrace } from "@/lib/types";
import { UpravitPraceForm } from "./UpravitPraceForm";

type Option = { id: string; label: string };

export function UpravitPraceModal({
  editRow,
  projekty,
  pracovnici,
}: {
  editRow: OdvedenaPrace | null;
  projekty: Option[];
  pracovnici: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(editRow));

  useEffect(() => {
    setOpen(Boolean(editRow));
  }, [editRow]);

  const close = useCallback(() => {
    setOpen(false);
    router.replace("/prace", { scroll: false });
  }, [router]);

  if (!editRow) return null;

  return (
    <DraggableModal open={open} onClose={close} title="Upravit odvedenou práci">
      <UpravitPraceForm
        row={editRow}
        projekty={projekty}
        pracovnici={pracovnici}
        onCancel={close}
      />
    </DraggableModal>
  );
}
