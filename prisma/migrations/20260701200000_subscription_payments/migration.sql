-- Registre des encaissements (soft delete via deletedAt). paidAmount facture = somme des non supprimés.
CREATE TABLE "SubscriptionPayment" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "method" TEXT,
  "reference" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "createdById" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SubscriptionPayment_invoiceId_idx" ON "SubscriptionPayment"("invoiceId");
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "SubscriptionInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill : convertir le paidAmount cumulé existant en un encaissement initial.
INSERT INTO "SubscriptionPayment" ("id", "invoiceId", "amount", "method", "reference", "paidAt", "note", "createdAt", "updatedAt")
SELECT 'migr_' || "id", "id", "paidAmount", "method", "reference", COALESCE("paidAt", "updatedAt"), 'Encaissement repris (migration)', "updatedAt", "updatedAt"
FROM "SubscriptionInvoice"
WHERE "paidAmount" > 0;
