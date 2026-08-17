"use client";

import { sendFakturaEmailAction } from "@/lib/actions/faktura";
import { FormField } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatDate } from "@/lib/format";
import type { Faktura } from "@/lib/types";

export function FakturaEmailPanel({
  faktura,
  defaultEmail,
  returnTo,
}: {
  faktura: Faktura;
  defaultEmail: string;
  returnTo?: string;
}) {
  if (!faktura.idoklad_id && !faktura.idoklad_url) return null;

  const send = sendFakturaEmailAction.bind(null, faktura.id);

  return (
    <form action={send} className="space-y-3 border-t border-border pt-4 mt-4">
      <div>
        <h3 className="text-sm font-semibold">Odeslat fakturu e-mailem</h3>
        <p className="text-xs text-gray-500 mt-1">
          Odešle odkaz do iDokladu na fakturační e-mail zákazníka.
        </p>
      </div>
      <FormField
        label="E-mail příjemce"
        name="email"
        type="email"
        defaultValue={defaultEmail}
        hint="Výchozí je fakturační e-mail zákazníka — před odesláním můžete upravit."
      />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {faktura.odeslano_email ? (
        <p className="text-xs text-gray-500">
          Naposledy odesláno na <strong>{faktura.odeslano_email}</strong>
          {faktura.odeslano_at ? ` (${formatDate(faktura.odeslano_at)})` : null}
        </p>
      ) : null}
      <SubmitButton>Odeslat fakturu e-mailem</SubmitButton>
    </form>
  );
}
