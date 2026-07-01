-- SMTP dédié de la plateforme (factures d'abonnement envoyées depuis @escale.ma).
ALTER TABLE "PlatformBilling" ADD COLUMN "smtpHost" TEXT;
ALTER TABLE "PlatformBilling" ADD COLUMN "smtpPort" INTEGER;
ALTER TABLE "PlatformBilling" ADD COLUMN "smtpSecure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlatformBilling" ADD COLUMN "smtpUser" TEXT;
ALTER TABLE "PlatformBilling" ADD COLUMN "smtpPass" TEXT;
ALTER TABLE "PlatformBilling" ADD COLUMN "smtpFrom" TEXT;
