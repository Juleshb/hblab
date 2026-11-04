CREATE TYPE "HbmsAnnouncementKind" AS ENUM ('MEETING', 'PRODUCTION', 'INTERNSHIP', 'DEADLINE', 'TRAINING', 'GENERAL');
CREATE TYPE "HbmsNotificationKind" AS ENUM ('MEETING', 'ANNOUNCEMENT', 'TASK_ASSIGNED', 'TASK_UPDATED', 'DEADLINE');

ALTER TABLE "HbmsMeeting" ADD COLUMN "location" TEXT;
ALTER TABLE "HbmsMeeting" ADD COLUMN "agenda" TEXT;
ALTER TABLE "HbmsMeeting" ADD COLUMN "minutes" TEXT;

ALTER TABLE "HbmsTask" ADD COLUMN "meetingId" TEXT;
CREATE INDEX "HbmsTask_meetingId_idx" ON "HbmsTask"("meetingId");
ALTER TABLE "HbmsTask" ADD CONSTRAINT "HbmsTask_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HbmsMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HbmsAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" "HbmsAnnouncementKind" NOT NULL DEFAULT 'GENERAL',
    "businessUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsAnnouncement_businessUnitId_idx" ON "HbmsAnnouncement"("businessUnitId");
CREATE INDEX "HbmsAnnouncement_createdAt_idx" ON "HbmsAnnouncement"("createdAt");

ALTER TABLE "HbmsAnnouncement" ADD CONSTRAINT "HbmsAnnouncement_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HbmsNotification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "kind" "HbmsNotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsNotification_employeeId_createdAt_idx" ON "HbmsNotification"("employeeId", "createdAt");
CREATE INDEX "HbmsNotification_entityId_idx" ON "HbmsNotification"("entityId");

ALTER TABLE "HbmsNotification" ADD CONSTRAINT "HbmsNotification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
