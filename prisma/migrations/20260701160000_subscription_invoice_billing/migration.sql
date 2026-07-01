-- Facture d'abonnement : numérotation, TVA (amount = HT), suivi des relances.
ALTER TABLE "SubscriptionInvoice" ADD COLUMN "number" TEXT;
ALTER TABLE "SubscriptionInvoice" ADD COLUMN "label" TEXT;
ALTER TABLE "SubscriptionInvoice" ADD COLUMN "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20;
ALTER TABLE "SubscriptionInvoice" ADD COLUMN "remindersSent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SubscriptionInvoice" ADD COLUMN "lastReminderAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "SubscriptionInvoice_number_key" ON "SubscriptionInvoice"("number");

-- Identité de facturation de la plateforme (Evead) — singleton.
CREATE TABLE "PlatformBilling" (
  "id" TEXT NOT NULL DEFAULT 'platform',
  "name" TEXT,
  "legalForm" TEXT,
  "address" TEXT,
  "city" TEXT,
  "ice" TEXT,
  "rc" TEXT,
  "taxId" TEXT,
  "patente" TEXT,
  "cnss" TEXT,
  "capital" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "bank" TEXT,
  "rib" TEXT,
  "swift" TEXT,
  "invoicePrefix" TEXT NOT NULL DEFAULT 'ESC',
  "invoiceFooter" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformBilling_pkey" PRIMARY KEY ("id")
);
