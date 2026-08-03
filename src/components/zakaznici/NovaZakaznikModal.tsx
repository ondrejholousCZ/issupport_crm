"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { Button } from "@/components/ui/Button";
import { createZakaznikAction } from "@/lib/actions/zakaznik";
import { ZakaznikForm } from "./ZakaznikForm";

export function NovaZakaznikModalTrigger({ defaultOpen = false }: { defaultOpen?: boolean }) {
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
    router.replace(qs ? `/zakaznici?${qs}` : "/zakaznici", { scroll: false });
  }, [router, searchParams]);

  const launch = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <Button type="button" onClick={launch}>
        + Nový zákazník
      </Button>
      <DraggableModal
        open={open}
        onClose={close}
        title="Nový zákazník"
        closeOnBackdropClick={false}
      >
        <ZakaznikForm action={createZakaznikAction} onCancel={close} />
      </DraggableModal>
    </>
  );
}
