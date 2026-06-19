-- Configuration WhatsApp (OpenWA / WAHA) : notifications sortantes via API.
-- waApiKey est chiffrée applicativement (encryptSecret) avant stockage.

ALTER TABLE "AppSetting" ADD COLUMN "waApiUrl" TEXT;
ALTER TABLE "AppSetting" ADD COLUMN "waApiKey" TEXT;
ALTER TABLE "AppSetting" ADD COLUMN "waSession" TEXT DEFAULT 'default';
