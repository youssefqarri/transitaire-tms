-- CreateTable
CREATE TABLE "ExpectedDocument" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "name" TEXT,
    "note" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "requestedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpectedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpectedDocument_dossierId_idx" ON "ExpectedDocument"("dossierId");

-- AddForeignKey
ALTER TABLE "ExpectedDocument" ADD CONSTRAINT "ExpectedDocument_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedDocument" ADD CONSTRAINT "ExpectedDocument_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
