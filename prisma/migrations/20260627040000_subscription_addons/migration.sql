-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "addons" TEXT[] DEFAULT ARRAY[]::TEXT[];

