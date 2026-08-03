"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/Spinner";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-sidebar-text hover:text-white transition-colors disabled:opacity-60 mt-3 inline-flex items-center min-h-[16px]"
    >
      {pending ? <Spinner className="h-3 w-3" /> : "Odhlásit se"}
    </button>
  );
}
