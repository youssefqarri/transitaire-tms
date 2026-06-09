-- ============================================================
-- Multi-tenant : Organization + orgId sur les tables racines
-- ⚠️ À APPLIQUER SUR STAGING (pas la prod) — voir docs/MULTI-TENANT.md
-- Additif : orgId nullable + backfill vers une org par défaut.
-- ============================================================

-- 1. Table Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ice" TEXT, "rc" TEXT, "taxId" TEXT, "patente" TEXT, "cnss" TEXT,
    "address" TEXT, "city" TEXT, "phone" TEXT, "email" TEXT, "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");

-- 2. Org par défaut pour les données existantes
INSERT INTO "Organization" ("id", "name", "slug")
VALUES ('org_default', 'Cabinet (par défaut)', 'default')
ON CONFLICT ("slug") DO NOTHING;

-- 3. Ajout orgId (nullable) sur les tables racines
ALTER TABLE "User"            ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "Client"          ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "Supplier"        ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "Dossier"         ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "Invoice"         ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "EmailAccount"    ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "Notification"    ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "AuditLog"        ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "OutgoingMessage" ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "AppSetting"      ADD COLUMN IF NOT EXISTS "orgId" TEXT;

-- 4. Backfill vers l'org par défaut
UPDATE "User"            SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Client"          SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Supplier"        SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Dossier"         SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Invoice"         SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "MessageTemplate" SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "EmailAccount"    SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "Notification"    SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "AuditLog"        SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "OutgoingMessage" SET "orgId" = 'org_default' WHERE "orgId" IS NULL;
UPDATE "AppSetting"      SET "orgId" = 'org_default' WHERE "orgId" IS NULL;

-- 5. FKs
DO $$ BEGIN
  ALTER TABLE "User"            ADD CONSTRAINT "User_orgId_fkey"            FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "Client"          ADD CONSTRAINT "Client_orgId_fkey"          FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "Supplier"        ADD CONSTRAINT "Supplier_orgId_fkey"        FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "Dossier"         ADD CONSTRAINT "Dossier_orgId_fkey"         FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "Invoice"         ADD CONSTRAINT "Invoice_orgId_fkey"         FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "EmailAccount"    ADD CONSTRAINT "EmailAccount_orgId_fkey"    FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "Notification"    ADD CONSTRAINT "Notification_orgId_fkey"    FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "AuditLog"        ADD CONSTRAINT "AuditLog_orgId_fkey"        FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "OutgoingMessage" ADD CONSTRAINT "OutgoingMessage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
  ALTER TABLE "AppSetting"      ADD CONSTRAINT "AppSetting_orgId_fkey"      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Unicité par tenant : DURCISSEMENT PHASE 2 (une fois orgId backfillé + NOT NULL).
--    On garde les uniques globaux pour l'instant (fondation additive, sans régression).
--    Settings par org (one-to-one) :
CREATE UNIQUE INDEX IF NOT EXISTS "AppSetting_orgId_key"       ON "AppSetting"("orgId");

-- 7. Index orgId
CREATE INDEX IF NOT EXISTS "User_orgId_idx"            ON "User"("orgId");
CREATE INDEX IF NOT EXISTS "Client_orgId_idx"          ON "Client"("orgId");
CREATE INDEX IF NOT EXISTS "Supplier_orgId_idx"        ON "Supplier"("orgId");
CREATE INDEX IF NOT EXISTS "Dossier_orgId_idx"         ON "Dossier"("orgId");
CREATE INDEX IF NOT EXISTS "Invoice_orgId_idx"         ON "Invoice"("orgId");
CREATE INDEX IF NOT EXISTS "MessageTemplate_orgId_idx" ON "MessageTemplate"("orgId");
CREATE INDEX IF NOT EXISTS "EmailAccount_orgId_idx"    ON "EmailAccount"("orgId");
CREATE INDEX IF NOT EXISTS "Notification_orgId_read_idx" ON "Notification"("orgId", "read");
CREATE INDEX IF NOT EXISTS "AuditLog_orgId_idx"        ON "AuditLog"("orgId");
CREATE INDEX IF NOT EXISTS "OutgoingMessage_orgId_idx" ON "OutgoingMessage"("orgId");

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
