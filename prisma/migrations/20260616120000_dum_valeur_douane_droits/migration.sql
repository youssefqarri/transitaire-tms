-- DUM : valeur en douane + droits & taxes (estimés/liquidés) + quittance + date de paiement
-- Colonnes additives nullables (rétro-compatibles : le code existant les ignore).
ALTER TABLE "DUM"
  ADD COLUMN "customsValue"     DECIMAL(14,2),
  ADD COLUMN "estimatedDuties"  DECIMAL(12,2),
  ADD COLUMN "liquidatedDuties" DECIMAL(12,2),
  ADD COLUMN "receiptNumber"    TEXT,
  ADD COLUMN "paidAt"           TIMESTAMP(3);
