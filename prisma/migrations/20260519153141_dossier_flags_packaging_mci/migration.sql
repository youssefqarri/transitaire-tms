-- CreateEnum
CREATE TYPE "PackagingUnit" AS ENUM ('COLIS', 'PALETTES', 'CONTENEURS');

-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "awaitingConformityValidation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baeUnderConformity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baeUnderPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "billed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "conformityVisitDate" TIMESTAMP(3),
ADD COLUMN     "customNote" TEXT,
ADD COLUMN     "delivered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "goodsPackagingUnit" "PackagingUnit" NOT NULL DEFAULT 'COLIS',
ADD COLUMN     "hasConformityVisit" BOOLEAN NOT NULL DEFAULT false;
