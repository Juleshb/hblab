CREATE TYPE "HbmsAttendancePolicy" AS ENUM ('OFFICE', 'REMOTE', 'EVENT', 'FLEXIBLE');
CREATE TYPE "HbmsAttendanceSource" AS ENUM ('CHECKIN', 'EVENT', 'ABSENCE');
CREATE TYPE "HbmsLeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID', 'OTHER');

ALTER TABLE "Employee" ADD COLUMN "attendancePolicy" "HbmsAttendancePolicy" NOT NULL DEFAULT 'OFFICE';
ALTER TABLE "Employee" ADD COLUMN "workDays" TEXT NOT NULL DEFAULT '1,2,3,4,5';
ALTER TABLE "Employee" ADD COLUMN "shiftStart" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "Employee" ADD COLUMN "shiftEnd" TEXT NOT NULL DEFAULT '17:00';

UPDATE "Employee" SET "attendancePolicy" = 'FLEXIBLE' WHERE "employmentType" = 'FREELANCE';

ALTER TABLE "HbmsAttendance" ADD COLUMN "checkedInAt" TIMESTAMP(3);
ALTER TABLE "HbmsAttendance" ADD COLUMN "checkedOutAt" TIMESTAMP(3);
ALTER TABLE "HbmsAttendance" ADD COLUMN "note" TEXT;
ALTER TABLE "HbmsAttendance" ADD COLUMN "source" "HbmsAttendanceSource" NOT NULL DEFAULT 'CHECKIN';
ALTER TABLE "HbmsAttendance" ADD COLUMN "approvalStatus" "ApprovalStatus";
ALTER TABLE "HbmsAttendance" ADD COLUMN "projectId" TEXT;

CREATE INDEX "HbmsAttendance_projectId_idx" ON "HbmsAttendance"("projectId");

ALTER TABLE "HbmsAttendance" ADD CONSTRAINT "HbmsAttendance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HbmsLeaveRequest" ADD COLUMN "leaveType" "HbmsLeaveType" NOT NULL DEFAULT 'ANNUAL';

CREATE TABLE "HbmsHoliday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "holidayDate" TIMESTAMP(3) NOT NULL,
    "businessUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsHoliday_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsHoliday_holidayDate_idx" ON "HbmsHoliday"("holidayDate");
CREATE INDEX "HbmsHoliday_businessUnitId_idx" ON "HbmsHoliday"("businessUnitId");

ALTER TABLE "HbmsHoliday" ADD CONSTRAINT "HbmsHoliday_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsTimesheet" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "projectId" TEXT,
    "workDate" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "note" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsTimesheet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsTimesheet_employeeId_workDate_idx" ON "HbmsTimesheet"("employeeId", "workDate");
CREATE INDEX "HbmsTimesheet_projectId_idx" ON "HbmsTimesheet"("projectId");
CREATE INDEX "HbmsTimesheet_status_idx" ON "HbmsTimesheet"("status");

ALTER TABLE "HbmsTimesheet" ADD CONSTRAINT "HbmsTimesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsTimesheet" ADD CONSTRAINT "HbmsTimesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
