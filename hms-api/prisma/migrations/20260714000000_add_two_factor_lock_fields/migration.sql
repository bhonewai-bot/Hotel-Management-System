-- AlterTable
ALTER TABLE "two_factor" ADD COLUMN "failedVerificationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "two_factor" ADD COLUMN "lockedUntil" TIMESTAMP(3);
