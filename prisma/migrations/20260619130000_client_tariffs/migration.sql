-- Fiche tarifaire par client (point 6 cliente) : lignes récurrentes pré-remplies
-- à la création d'une facture. Les débours, variables, restent saisis au cas par cas.

CREATE TABLE "ClientTariff" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" "InvoiceItemKind" NOT NULL DEFAULT 'HONORAIRE',
    "code" TEXT,
    "description" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientTariff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientTariff_clientId_idx" ON "ClientTariff"("clientId");

ALTER TABLE "ClientTariff"
    ADD CONSTRAINT "ClientTariff_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
