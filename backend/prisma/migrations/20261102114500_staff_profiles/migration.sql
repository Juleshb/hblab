-- Replace employment types with the staff categories used by HBLab and HBStudio.
CREATE TYPE "EmploymentType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERN', 'TRAINER', 'FREELANCE');

ALTER TABLE "Employee" ALTER COLUMN "employmentType" DROP DEFAULT;
ALTER TABLE "Employee"
  ALTER COLUMN "employmentType" TYPE "EmploymentType_new"
  USING (
    CASE "employmentType"::text
      WHEN 'EMPLOYEE' THEN 'FULL_TIME'
      WHEN 'CONTRACTOR' THEN 'FREELANCE'
      WHEN 'FREELANCER' THEN 'FREELANCE'
      ELSE "employmentType"::text
    END
  )::"EmploymentType_new";

ALTER TYPE "EmploymentType" RENAME TO "EmploymentType_old";
ALTER TYPE "EmploymentType_new" RENAME TO "EmploymentType";
DROP TYPE "EmploymentType_old";
ALTER TABLE "Employee" ALTER COLUMN "employmentType" SET DEFAULT 'FULL_TIME';

-- CreateEnum
CREATE TYPE "StaffDocumentKind" AS ENUM ('CONTRACT', 'IDENTIFICATION', 'CERTIFICATE', 'OTHER');

-- AlterTable
ALTER TABLE "Position" ADD COLUMN "responsibilities" TEXT;

ALTER TABLE "Employee" ADD COLUMN "staffCode" TEXT;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS n
  FROM "Employee"
)
UPDATE "Employee" AS employee
SET "staffCode" = 'HB-' || LPAD(numbered.n::text, 3, '0')
FROM numbered
WHERE employee.id = numbered.id;

ALTER TABLE "Employee" ALTER COLUMN "staffCode" SET NOT NULL;
CREATE UNIQUE INDEX "Employee_staffCode_key" ON "Employee"("staffCode");

ALTER TABLE "HbmsLeaveRequest" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "HbmsLeaveRequest" ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HbmsExperience" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HbmsStaffDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "StaffDocumentKind" NOT NULL DEFAULT 'CONTRACT',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsStaffDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsExperience_employeeId_idx" ON "HbmsExperience"("employeeId");
CREATE INDEX "HbmsStaffDocument_employeeId_idx" ON "HbmsStaffDocument"("employeeId");

ALTER TABLE "HbmsExperience" ADD CONSTRAINT "HbmsExperience_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsStaffDocument" ADD CONSTRAINT "HbmsStaffDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
