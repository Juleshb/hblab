CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx" ON "ContactMessage"("email");

CREATE TABLE IF NOT EXISTS "ContactReply" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactReply_messageId_idx" ON "ContactReply"("messageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ContactReply_messageId_fkey'
  ) THEN
    ALTER TABLE "ContactReply"
      ADD CONSTRAINT "ContactReply_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
