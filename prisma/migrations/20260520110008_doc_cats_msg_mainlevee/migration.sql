-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentCategory" ADD VALUE 'MAIN_LEVEE_RESERVE_PAIEMENT';
ALTER TYPE "DocumentCategory" ADD VALUE 'MESSAGE_PORTNET';
ALTER TYPE "DocumentCategory" ADD VALUE 'MESSAGE_DOUANE';
ALTER TYPE "DocumentCategory" ADD VALUE 'MESSAGE_CONFORMITE';
