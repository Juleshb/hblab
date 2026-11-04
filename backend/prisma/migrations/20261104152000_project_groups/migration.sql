ALTER TYPE "HbmsConversationKind" ADD VALUE 'PROJECT';

ALTER TABLE "HbmsConversation" ADD COLUMN "projectId" TEXT;
ALTER TABLE "HbmsConversation" ADD COLUMN "createdById" TEXT;

CREATE UNIQUE INDEX "HbmsConversation_projectId_key" ON "HbmsConversation"("projectId");
CREATE INDEX "HbmsConversation_createdById_idx" ON "HbmsConversation"("createdById");

ALTER TABLE "HbmsConversation" ADD CONSTRAINT "HbmsConversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsConversation" ADD CONSTRAINT "HbmsConversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
