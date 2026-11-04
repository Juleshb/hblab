CREATE TABLE "HbmsCall" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "callerId" INTEGER NOT NULL,
    "calleeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "HbmsCall_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsCall_callerId_startedAt_idx" ON "HbmsCall"("callerId", "startedAt");
CREATE INDEX "HbmsCall_calleeId_startedAt_idx" ON "HbmsCall"("calleeId", "startedAt");
CREATE INDEX "HbmsCall_conversationId_idx" ON "HbmsCall"("conversationId");

ALTER TABLE "HbmsCall" ADD CONSTRAINT "HbmsCall_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HbmsConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsCall" ADD CONSTRAINT "HbmsCall_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsCall" ADD CONSTRAINT "HbmsCall_calleeId_fkey" FOREIGN KEY ("calleeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
