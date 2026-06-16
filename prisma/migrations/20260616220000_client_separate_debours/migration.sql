-- Préférence par client : facturer les débours séparément (ex. Jotun).
ALTER TABLE "Client" ADD COLUMN "separateDebours" BOOLEAN NOT NULL DEFAULT false;
