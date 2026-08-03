"use client";

import { useRouter } from "next/navigation";
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
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const close = useCallback(() => {
    setOpen(false);
    router.replace("/prace", { scroll: false });
  }, [router]);

  const launch = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <Button type="button" onClick={launch}>
        + Nová práce
      </Button>
      <DraggableModal open={open} onClose={close} title="Nová odvedená práce">
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
