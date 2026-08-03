"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { Button } from "@/components/ui/Button";
import { createFakturaAction } from "@/lib/actions/faktura";
import { todayIso } from "@/lib/format";
import { FakturaForm } from "./FakturaForm";

type ZakaznikOption = { id: string; nazev: string };
type LinkedOption = { id: string; label: string; zakaznik_id: string };

export function NovaFakturaModalTrigger({
  zakaznici,
  projekty,
  sluzby,
  defaultOpen = false,
  defaultZakaznik = "",
}: {
  zakaznici: ZakaznikOption[];
  projekty: LinkedOption[];
  sluzby: LinkedOption[];
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
    router.replace(qs ? `/faktury?${qs}` : "/faktury", { scroll: false });
  }, [router, searchParams]);

  const launch = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <Button type="button" onClick={launch}>
        + Nová faktura
      </Button>
      <DraggableModal
        open={open}
        onClose={close}
        title="Nová faktura"
        closeOnBackdropClick={false}
      >
        <FakturaForm
          action={createFakturaAction}
          zakaznici={zakaznici}
          projekty={projekty}
          sluzby={sluzby}
          onCancel={close}
          defaultValues={{
            zakaznik_id: defaultZakaznik,
            datum_vystaveni: todayIso(),
          }}
        />
      </DraggableModal>
    </>
  );
}
