ALTER TYPE "HbmsProjectCategory" ADD VALUE IF NOT EXISTS 'ECOMMERCE';
ALTER TYPE "HbmsProjectCategory" ADD VALUE IF NOT EXISTS 'MOBILE';
ALTER TYPE "HbmsProjectCategory" ADD VALUE IF NOT EXISTS 'INFRASTRUCTURE';
ALTER TYPE "HbmsProjectCategory" ADD VALUE IF NOT EXISTS 'LIVESTREAM';
ALTER TYPE "HbmsProjectCategory" ADD VALUE IF NOT EXISTS 'BRANDING';
ALTER TYPE "HbmsProjectCategory" ADD VALUE IF NOT EXISTS 'PODCAST';

ALTER TABLE "HbmsProject" ADD COLUMN "code" TEXT;
ALTER TABLE "HbmsProject" ADD COLUMN "budgetAmount" INTEGER;
ALTER TABLE "HbmsProject" ADD COLUMN "budgetCurrency" TEXT NOT NULL DEFAULT 'RWF';

WITH numbered AS (
  SELECT project.id, unit.code AS "unitCode", ROW_NUMBER() OVER (PARTITION BY project."businessUnitId" ORDER BY project."createdAt") AS n
  FROM "HbmsProject" AS project
  JOIN "BusinessUnit" AS unit ON unit.id = project."businessUnitId"
)
UPDATE "HbmsProject" AS project
SET "code" = CASE numbered."unitCode"
  WHEN 'HBSTUDIO' THEN 'HBS-'
  ELSE 'HBL-'
END || LPAD(numbered.n::text, 3, '0')
FROM numbered
WHERE project.id = numbered.id;

ALTER TABLE "HbmsProject" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "HbmsProject_code_key" ON "HbmsProject"("code");

CREATE TABLE "HbmsTaskFile" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsTaskFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsTaskFile_taskId_idx" ON "HbmsTaskFile"("taskId");

ALTER TABLE "HbmsTaskFile" ADD CONSTRAINT "HbmsTaskFile_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HbmsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
