"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { Button } from "@/components/ui/Button";
import { createPracovnikAction } from "@/lib/actions/pracovnik";
import { PracovnikForm } from "./PracovnikForm";

export function NovaPracovnikModalTrigger({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const close = useCallback(() => {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("nova");
    const qs = params.toString();
    router.replace(qs ? `/pracovnici?${qs}` : "/pracovnici", { scroll: false });
  }, [router, searchParams]);

  const launch = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <Button type="button" onClick={launch}>
        + Nový pracovník
      </Button>
      <DraggableModal
        open={open}
        onClose={close}
        title="Nový pracovník"
        closeOnBackdropClick={false}
      >
        <PracovnikForm action={createPracovnikAction} onCancel={close} />
      </DraggableModal>
    </>
  );
}
