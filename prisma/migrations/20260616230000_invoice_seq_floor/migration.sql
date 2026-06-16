-- Réglage « prochain numéro de facture » (reprise de la série FA au moment de la bascule WinApp → outil).
ALTER TABLE "AppSetting" ADD COLUMN "invoiceSeqYear" INTEGER;
ALTER TABLE "AppSetting" ADD COLUMN "invoiceSeqFloor" INTEGER;
