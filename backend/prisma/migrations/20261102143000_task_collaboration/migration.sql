ALTER TABLE "HbmsProject" ADD COLUMN "requiresApproval" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "HbmsTask" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "HbmsTask" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "HbmsTaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsTaskChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsTaskChecklistItem_taskId_idx" ON "HbmsTaskChecklistItem"("taskId");

ALTER TABLE "HbmsTaskChecklistItem" ADD CONSTRAINT "HbmsTaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HbmsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsTaskEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsTaskEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsTaskEvent_taskId_createdAt_idx" ON "HbmsTaskEvent"("taskId", "createdAt");

ALTER TABLE "HbmsTaskEvent" ADD CONSTRAINT "HbmsTaskEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HbmsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "projectId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsMeeting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsMeeting_startsAt_idx" ON "HbmsMeeting"("startsAt");
CREATE INDEX "HbmsMeeting_projectId_idx" ON "HbmsMeeting"("projectId");

ALTER TABLE "HbmsMeeting" ADD CONSTRAINT "HbmsMeeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HbmsMeetingAttendee" (
    "meetingId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "HbmsMeetingAttendee_pkey" PRIMARY KEY ("meetingId","employeeId")
);

CREATE INDEX "HbmsMeetingAttendee_employeeId_idx" ON "HbmsMeetingAttendee"("employeeId");

ALTER TABLE "HbmsMeetingAttendee" ADD CONSTRAINT "HbmsMeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HbmsMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsMeetingAttendee" ADD CONSTRAINT "HbmsMeetingAttendee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
