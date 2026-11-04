ALTER TABLE "HbmsConversationMember" ADD COLUMN "id" TEXT;
UPDATE "HbmsConversationMember" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
ALTER TABLE "HbmsConversationMember" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "HbmsConversationMember" DROP CONSTRAINT "HbmsConversationMember_pkey";
ALTER TABLE "HbmsConversationMember" ADD CONSTRAINT "HbmsConversationMember_pkey" PRIMARY KEY ("id");
ALTER TABLE "HbmsConversationMember" ALTER COLUMN "employeeId" DROP NOT NULL;
ALTER TABLE "HbmsConversationMember" ADD COLUMN "userId" INTEGER;

CREATE UNIQUE INDEX "HbmsConversationMember_conversationId_employeeId_key" ON "HbmsConversationMember"("conversationId", "employeeId");
CREATE UNIQUE INDEX "HbmsConversationMember_conversationId_userId_key" ON "HbmsConversationMember"("conversationId", "userId");
CREATE INDEX "HbmsConversationMember_userId_idx" ON "HbmsConversationMember"("userId");

ALTER TABLE "HbmsConversationMember" ADD CONSTRAINT "HbmsConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HbmsConversationMessage" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "HbmsConversationMessage" ADD COLUMN "authorUserId" INTEGER;
ALTER TABLE "HbmsConversationMessage" DROP CONSTRAINT "HbmsConversationMessage_authorId_fkey";
ALTER TABLE "HbmsConversationMessage" ADD CONSTRAINT "HbmsConversationMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsConversationMessage" ADD CONSTRAINT "HbmsConversationMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
