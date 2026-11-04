ALTER TABLE "HbmsConversationMessage" ADD COLUMN "replyToId" TEXT;

CREATE TABLE "HbmsMessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsMessageReaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsConversationMessage_replyToId_idx" ON "HbmsConversationMessage"("replyToId");
CREATE UNIQUE INDEX "HbmsMessageReaction_messageId_userId_key" ON "HbmsMessageReaction"("messageId", "userId");
CREATE INDEX "HbmsMessageReaction_messageId_idx" ON "HbmsMessageReaction"("messageId");

ALTER TABLE "HbmsConversationMessage" ADD CONSTRAINT "HbmsConversationMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "HbmsConversationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsMessageReaction" ADD CONSTRAINT "HbmsMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "HbmsConversationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsMessageReaction" ADD CONSTRAINT "HbmsMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
