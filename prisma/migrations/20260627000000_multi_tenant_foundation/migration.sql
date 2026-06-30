-- ============================================================
-- Fondation multi-tenant (Phase B) — additif, SANS régression.
-- Organization + orgId (nullable) sur 12 tables racines + backfill "org_default".
-- Le scoping par orgId (sweep applicatif, uniques composites, RLS) viendra dans
-- des migrations ultérieures (phases C/D). Voir docs/PLAN-SAAS-MULTI-TENANT-RBAC.md.
-- ============================================================

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "EmailAccount" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "CreditNote" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "MessageTemplate" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "OutgoingMessage" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "AppSetting" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "orgId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ice" TEXT,
    "rc" TEXT,
    "taxId" TEXT,
    "patente" TEXT,
    "cnss" TEXT,
    "agrement" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "Client_orgId_idx" ON "Client"("orgId");

-- CreateIndex
CREATE INDEX "Supplier_orgId_idx" ON "Supplier"("orgId");

-- CreateIndex
CREATE INDEX "Dossier_orgId_idx" ON "Dossier"("orgId");

-- CreateIndex
CREATE INDEX "EmailAccount_orgId_idx" ON "EmailAccount"("orgId");

-- CreateIndex
CREATE INDEX "Notification_orgId_idx" ON "Notification"("orgId");

-- CreateIndex
CREATE INDEX "Invoice_orgId_idx" ON "Invoice"("orgId");

-- CreateIndex
CREATE INDEX "CreditNote_orgId_idx" ON "CreditNote"("orgId");

-- CreateIndex
CREATE INDEX "MessageTemplate_orgId_idx" ON "MessageTemplate"("orgId");

-- CreateIndex
CREATE INDEX "OutgoingMessage_orgId_idx" ON "OutgoingMessage"("orgId");

-- CreateIndex
CREATE INDEX "AppSetting_orgId_idx" ON "AppSetting"("orgId");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_idx" ON "AuditLog"("orgId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutgoingMessage" ADD CONSTRAINT "OutgoingMessage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- Donnees : org par defaut (= cabinet actuel) + rattachement de l'existant
-- ============================================================
INSERT INTO "Organization" ("id", "name", "slug", "updatedAt")
VALUES ('org_default', 'Cabinet (par défaut)', 'default', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "User"            SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Client"          SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Supplier"        SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Dossier"         SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "EmailAccount"    SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Notification"    SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Invoice"         SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "CreditNote"      SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "MessageTemplate" SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "OutgoingMessage" SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "AppSetting"      SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "AuditLog"        SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
