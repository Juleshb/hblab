ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'awaiting_payment';

ALTER TABLE "CareerApplication" ADD COLUMN IF NOT EXISTS "applicationCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "CareerApplication_applicationCode_key" ON "CareerApplication"("applicationCode");
