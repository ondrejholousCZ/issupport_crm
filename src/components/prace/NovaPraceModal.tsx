"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { Button } from "@/components/ui/Button";
import { NovaPraceForm } from "./NovaPraceForm";

type Option = { id: string; label: string };

export function NovaPraceModalTrigger({
  projekty,
  pracovnici,
  defaultOpen = false,
  defaultProjekt = "",
}: {
  projekty: Option[];
  pracovnici: Option[];
  defaultOpen?: boolean;
  defaultProjekt?: string;
}) {
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
    router.replace(qs ? `/prace?${qs}` : "/prace", { scroll: false });
  }, [router, searchParams]);

  const launch = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <Button type="button" onClick={launch}>
        + Nová práce
      </Button>
      <DraggableModal
        open={open}
        onClose={close}
        title="Nová odvedená práce"
        closeOnBackdropClick={false}
      >
        <NovaPraceForm
          projekty={projekty}
          pracovnici={pracovnici}
          defaultProjekt={defaultProjekt}
          onCancel={close}
        />
      </DraggableModal>
    </>
  );
}
