-- CreateTable
CREATE TABLE "NotificationDeliveryAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outboxId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "failureCategory" TEXT,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    CONSTRAINT "NotificationDeliveryAttempt_outboxId_fkey" FOREIGN KEY ("outboxId") REFERENCES "NotificationOutbox" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NotificationDeliveryAttempt_outboxId_idx" ON "NotificationDeliveryAttempt"("outboxId");

-- CreateIndex
CREATE INDEX "NotificationDeliveryAttempt_outcome_idx" ON "NotificationDeliveryAttempt"("outcome");

-- CreateIndex
CREATE INDEX "NotificationDeliveryAttempt_failureCategory_idx" ON "NotificationDeliveryAttempt"("failureCategory");

-- CreateIndex
CREATE INDEX "NotificationDeliveryAttempt_startedAt_idx" ON "NotificationDeliveryAttempt"("startedAt");
