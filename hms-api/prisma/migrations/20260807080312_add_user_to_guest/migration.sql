-- AlterTable
ALTER TABLE "guest" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "guest_userId_idx" ON "guest"("userId");

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
