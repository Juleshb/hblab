CREATE TYPE "HbmsConversationKind" AS ENUM ('DIRECT', 'DEPARTMENT');
ALTER TYPE "HbmsNotificationKind" ADD VALUE 'CONVERSATION';

CREATE TABLE "HbmsConversation" (
    "id" TEXT NOT NULL,
    "kind" "HbmsConversationKind" NOT NULL,
    "departmentId" TEXT,
    "directKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsConversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HbmsConversation_departmentId_key" ON "HbmsConversation"("departmentId");
CREATE UNIQUE INDEX "HbmsConversation_directKey_key" ON "HbmsConversation"("directKey");
CREATE INDEX "HbmsConversation_kind_idx" ON "HbmsConversation"("kind");

CREATE TABLE "HbmsConversationMember" (
    "conversationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsConversationMember_pkey" PRIMARY KEY ("conversationId","employeeId")
);

CREATE INDEX "HbmsConversationMember_employeeId_idx" ON "HbmsConversationMember"("employeeId");

CREATE TABLE "HbmsConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "asDepartment" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsConversationMessage_conversationId_createdAt_idx" ON "HbmsConversationMessage"("conversationId", "createdAt");

ALTER TABLE "HbmsConversation" ADD CONSTRAINT "HbmsConversation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsConversationMember" ADD CONSTRAINT "HbmsConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HbmsConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsConversationMember" ADD CONSTRAINT "HbmsConversationMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsConversationMessage" ADD CONSTRAINT "HbmsConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HbmsConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsConversationMessage" ADD CONSTRAINT "HbmsConversationMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
