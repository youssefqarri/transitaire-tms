-- Add-ons inclus d'office dans un forfait (présélectionnés dans la console).
ALTER TABLE "Plan" ADD COLUMN "includedAddons" TEXT[] NOT NULL DEFAULT '{}';

-- Rallonge exceptionnelle : accès maintenu jusqu'à cette date même si échu/impayé.
ALTER TABLE "Subscription" ADD COLUMN "graceUntil" TIMESTAMP(3);

-- Suivi de l'encaissement (hors-ligne, paiement partiel possible).
ALTER TABLE "SubscriptionInvoice" ADD COLUMN "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
