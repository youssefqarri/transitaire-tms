import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { STATUS_LABELS, DOCUMENT_CATEGORY_LABELS, DUM_STATUS_LABELS } from "@/lib/statuses";
import { ROLE_LABELS } from "@/lib/roles";

// GET /api/v1/schema — référence des énumérations (pour Claude)
export async function GET(req: Request) {
  const ctx = await authenticate(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    dossierStatuses: STATUS_LABELS,
    dossierTypes: { IMPORT: "Import", EXPORT: "Export" },
    paymentModes: {
      WITH_PAYMENT: "Avec paiement (engagement importation requis)",
      WITHOUT_PAYMENT: "Sans paiement",
    },
    dumStatuses: DUM_STATUS_LABELS,
    documentCategories: DOCUMENT_CATEGORY_LABELS,
    roles: ROLE_LABELS,
  });
}
