ALTER TABLE "User" ADD COLUMN "passwordResetHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);
