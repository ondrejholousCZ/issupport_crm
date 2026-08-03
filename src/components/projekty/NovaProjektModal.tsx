"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { Button } from "@/components/ui/Button";
import { createProjektAction } from "@/lib/actions/projekt";
import { ProjektForm } from "./ProjektForm";

type ZakaznikOption = { id: string; nazev: string };

export function NovaProjektModalTrigger({
  zakaznici,
  defaultOpen = false,
  defaultZakaznik = "",
}: {
  zakaznici: ZakaznikOption[];
  defaultOpen?: boolean;
  defaultZakaznik?: string;
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
    params.delete("zakaznik");
    const qs = params.toString();
    router.replace(qs ? `/projekty?${qs}` : "/projekty", { scroll: false });
  }, [router, searchParams]);

  const launch = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <Button type="button" onClick={launch}>
        + Nový projekt
      </Button>
      <DraggableModal
        open={open}
        onClose={close}
        title="Nový projekt"
        closeOnBackdropClick={false}
      >
        <ProjektForm
          action={createProjektAction}
          zakaznici={zakaznici}
          onCancel={close}
          defaultValues={{ zakaznik_id: defaultZakaznik }}
        />
      </DraggableModal>
    </>
  );
}
