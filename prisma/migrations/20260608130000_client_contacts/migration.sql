-- Carnet de contacts client + destinataire mémorisé par dossier

-- Table ClientContact (plusieurs destinataires email par client)
CREATE TABLE IF NOT EXISTS "ClientContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientContact_clientId_email_key" ON "ClientContact"("clientId", "email");
CREATE INDEX IF NOT EXISTS "ClientContact_clientId_idx" ON "ClientContact"("clientId");

DO $$ BEGIN
  ALTER TABLE "ClientContact"
    ADD CONSTRAINT "ClientContact_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Cohérence avec le reste du schéma (RLS activé, accès via Prisma/connexion directe)
ALTER TABLE "ClientContact" ENABLE ROW LEVEL SECURITY;

-- Destinataire mémorisé pour CE dossier (pré-sélection aux prochains envois)
ALTER TABLE "Dossier" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
