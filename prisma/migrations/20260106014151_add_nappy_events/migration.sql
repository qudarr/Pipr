-- CreateEnum
CREATE TYPE "NappyType" AS ENUM ('wet', 'dirty', 'both');

-- CreateTable
CREATE TABLE "NappyEvent" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "NappyType" NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NappyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NappyEvent_familySpaceId_babyId_occurredAt_idx" ON "NappyEvent"("familySpaceId", "babyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "NappyEvent" ADD CONSTRAINT "NappyEvent_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NappyEvent" ADD CONSTRAINT "NappyEvent_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NappyEvent" ADD CONSTRAINT "NappyEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
