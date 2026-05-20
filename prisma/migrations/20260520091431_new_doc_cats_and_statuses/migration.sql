-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentCategory" ADD VALUE 'FACTURE_ORIGINALE';
ALTER TYPE "DocumentCategory" ADD VALUE 'LTA_ORIGINALE';
ALTER TYPE "DocumentCategory" ADD VALUE 'CMR';
ALTER TYPE "DocumentCategory" ADD VALUE 'DMP';
ALTER TYPE "DocumentCategory" ADD VALUE 'CERTIFICAT_PHYTOSANITAIRE';
ALTER TYPE "DocumentCategory" ADD VALUE 'ATTESTATION_POIDS_MESURE';
ALTER TYPE "DocumentCategory" ADD VALUE 'ATTESTATION_STOCKAGE';
ALTER TYPE "DocumentCategory" ADD VALUE 'CATALOGUE';
ALTER TYPE "DocumentCategory" ADD VALUE 'DEMANDE_SERVICE_MCI';
ALTER TYPE "DocumentCategory" ADD VALUE 'DEMANDE_SERVICE_PORTNET';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DossierStatus" ADD VALUE 'INSTANCE_FICHE_LIQUIDATION';
ALTER TYPE "DossierStatus" ADD VALUE 'MAIN_LEVEE_RESERVE_CONFORMITE';
ALTER TYPE "DossierStatus" ADD VALUE 'BON_A_ENLEVER';
ALTER TYPE "DossierStatus" ADD VALUE 'LIVRAISON';
ALTER TYPE "DossierStatus" ADD VALUE 'FACTURATION';
