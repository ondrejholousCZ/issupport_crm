import { sluzbaUrgency } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function SluzbaUrgencyBadge({ dalsiFakturace }: { dalsiFakturace: string | null }) {
  const urgency = sluzbaUrgency(dalsiFakturace);
  if (urgency === "overdue") return <StatusBadge label="Po termínu" tone="red" />;
  if (urgency === "soon") return <StatusBadge label="Do 30 dní" tone="yellow" />;
  if (urgency === "ok") return <StatusBadge label="V pořádku" tone="green" />;
  return <StatusBadge label="Neurčeno" tone="gray" />;
}
