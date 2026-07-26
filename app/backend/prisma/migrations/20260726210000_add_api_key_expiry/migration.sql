-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "ApiKey" ADD COLUMN "lastRemindedAt" DATETIME;

-- CreateIndex
CREATE INDEX "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");
