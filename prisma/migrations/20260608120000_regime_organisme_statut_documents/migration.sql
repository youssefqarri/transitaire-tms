-- Compléments specs cliente (juin 2026)

-- 1. Nouveau statut de dossier : Mainlevée sous réserve de production des documents
ALTER TYPE "DossierStatus" ADD VALUE IF NOT EXISTS 'MAIN_LEVEE_RESERVE_DOCUMENTS' AFTER 'MAIN_LEVEE_RESERVE_CONFORMITE';

-- 2. Régime douanier porté par chaque DUM (un dossier peut cumuler 2 régimes via 2 DUM)
ALTER TABLE "DUM" ADD COLUMN IF NOT EXISTS "regime" TEXT;

-- 3. Organisme de contrôle de conformité (1 seul) + services réglementaires sectoriels (0..N)
ALTER TABLE "Dossier" ADD COLUMN IF NOT EXISTS "controlOrganism" TEXT;
ALTER TABLE "Dossier" ADD COLUMN IF NOT EXISTS "regulatoryServices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
