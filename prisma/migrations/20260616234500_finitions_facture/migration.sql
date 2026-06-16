-- Finitions facture : émetteur éditable, code de ligne, lien dossier.

-- Émetteur de facture (coordonnées légales) éditables en base.
ALTER TABLE "AppSetting"
  ADD COLUMN "issuerName"      TEXT,
  ADD COLUMN "issuerLegalForm" TEXT,
  ADD COLUMN "issuerAddress"   TEXT,
  ADD COLUMN "issuerIce"       TEXT,
  ADD COLUMN "issuerRc"        TEXT,
  ADD COLUMN "issuerTaxId"     TEXT,
  ADD COLUMN "issuerPatente"   TEXT,
  ADD COLUMN "issuerCnss"      TEXT,
  ADD COLUMN "issuerAgrement"  TEXT,
  ADD COLUMN "issuerPhone"     TEXT,
  ADD COLUMN "issuerEmail"     TEXT,
  ADD COLUMN "issuerBank"      TEXT,
  ADD COLUMN "issuerRib"       TEXT,
  ADD COLUMN "issuerSwift"     TEXT;

-- Code de ligne (ex. D234, D0270, V002).
ALTER TABLE "InvoiceItem" ADD COLUMN "code" TEXT;

-- Dossier de référence d'une facture (bloc en-tête).
ALTER TABLE "Invoice" ADD COLUMN "dossierId" TEXT;
ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
