-- Soft-delete généralisé : deletedAt sur Document, Client, ClientContact, ExpectedDocument, MessageTemplate
ALTER TABLE "Document"        ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Client"          ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "ClientContact"   ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "ExpectedDocument" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "MessageTemplate" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Document_deletedAt_idx" ON "Document"("deletedAt");
CREATE INDEX IF NOT EXISTS "Client_deletedAt_idx" ON "Client"("deletedAt");
CREATE INDEX IF NOT EXISTS "ClientContact_deletedAt_idx" ON "ClientContact"("deletedAt");
CREATE INDEX IF NOT EXISTS "ExpectedDocument_deletedAt_idx" ON "ExpectedDocument"("deletedAt");
CREATE INDEX IF NOT EXISTS "MessageTemplate_deletedAt_idx" ON "MessageTemplate"("deletedAt");
