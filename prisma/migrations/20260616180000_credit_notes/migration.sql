-- Avoirs (notes de crédit) rattachés aux factures.
CREATE TYPE "CreditNoteStatus" AS ENUM ('ISSUED', 'APPLIED', 'CANCELLED');

CREATE TABLE "CreditNote" (
  "id"          TEXT NOT NULL,
  "number"      TEXT NOT NULL,
  "year"        INTEGER NOT NULL,
  "sequence"    INTEGER NOT NULL,
  "invoiceId"   TEXT NOT NULL,
  "amount"      DECIMAL(12,2) NOT NULL,
  "reason"      TEXT,
  "status"      "CreditNoteStatus" NOT NULL DEFAULT 'ISSUED',
  "createdById" TEXT,
  "issuedAt"    TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  "deletedAt"   TIMESTAMP(3),
  CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditNote_number_key" ON "CreditNote"("number");
CREATE UNIQUE INDEX "CreditNote_year_sequence_key" ON "CreditNote"("year", "sequence");
CREATE INDEX "CreditNote_invoiceId_idx" ON "CreditNote"("invoiceId");

ALTER TABLE "CreditNote"
  ADD CONSTRAINT "CreditNote_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
