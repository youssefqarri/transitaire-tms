-- Statuts spécifiques au flux EXPORT : embarquement au port + sortie de la marchandise.
ALTER TYPE "DossierStatus" ADD VALUE IF NOT EXISTS 'EMBARQUEMENT';
ALTER TYPE "DossierStatus" ADD VALUE IF NOT EXISTS 'SORTIE_MARCHANDISE';
