import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/statuses";
import type { DossierStatus } from "@/generated/prisma/enums";

export function StatusBadge({ status }: { status: DossierStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}
