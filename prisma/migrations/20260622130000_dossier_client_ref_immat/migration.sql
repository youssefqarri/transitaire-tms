-- V/Réf (référence / PO du client) + immatriculation (camion / n° conteneur)
-- sur le dossier, reportées sur l'en-tête de la facture. Demande cliente (point 4).

ALTER TABLE "Dossier" ADD COLUMN "clientReference" TEXT;
ALTER TABLE "Dossier" ADD COLUMN "transportRegistration" TEXT;
