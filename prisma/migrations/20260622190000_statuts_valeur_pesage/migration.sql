-- Nouveaux statuts douane :
--   • en instance de date de visite (avant « visite planifiée »)
--   • demande d'acceptation de la nouvelle valeur en douane (après bureau de valeur)
--   • demande de pesage (avant mainlevée)
ALTER TYPE "DossierStatus" ADD VALUE IF NOT EXISTS 'INSTANCE_DATE_VISITE';
ALTER TYPE "DossierStatus" ADD VALUE IF NOT EXISTS 'DEMANDE_ACCEPTATION_VALEUR';
ALTER TYPE "DossierStatus" ADD VALUE IF NOT EXISTS 'DEMANDE_PESAGE';
