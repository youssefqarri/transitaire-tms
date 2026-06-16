-- Mode de transport du dossier → détermine le titre de transport requis (BL/LTA/CMR).
CREATE TYPE "TransportMode" AS ENUM ('MARITIME', 'AERIEN', 'ROUTIER');
ALTER TABLE "Dossier" ADD COLUMN "transport" "TransportMode";

-- Back-fill des dossiers existants : on infère le transport depuis les pièces déjà
-- déposées (CMR→routier, LTA→aérien, connaissement→maritime). Les dossiers sans
-- indice restent NULL (la liste des documents requis retombe alors sur le BL).
UPDATE "Dossier" d SET "transport" = 'ROUTIER'
  WHERE "transport" IS NULL AND EXISTS (
    SELECT 1 FROM "Document" doc
    WHERE doc."dossierId" = d.id AND doc."category" = 'CMR' AND doc."deletedAt" IS NULL);
UPDATE "Dossier" d SET "transport" = 'AERIEN'
  WHERE "transport" IS NULL AND EXISTS (
    SELECT 1 FROM "Document" doc
    WHERE doc."dossierId" = d.id AND doc."category" = 'LTA_ORIGINALE' AND doc."deletedAt" IS NULL);
UPDATE "Dossier" d SET "transport" = 'MARITIME'
  WHERE "transport" IS NULL AND EXISTS (
    SELECT 1 FROM "Document" doc
    WHERE doc."dossierId" = d.id AND doc."category" = 'CONNAISSEMENT' AND doc."deletedAt" IS NULL);
