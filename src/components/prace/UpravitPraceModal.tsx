"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
    router.replace(qs ? `/prace?${qs}` : "/prace", { scroll: false });
  }, [router, searchParams]);

  const returnQuery = searchParams.toString();

  if (!editRow) return null;

  return (
    <DraggableModal open={open} onClose={close} title="Upravit odvedenou práci">
      <UpravitPraceForm
        row={editRow}
        projekty={projekty}
        pracovnici={pracovnici}
        returnQuery={returnQuery}
        onCancel={close}
      />
    </DraggableModal>
  );
}
