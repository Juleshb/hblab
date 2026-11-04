CREATE TABLE "HbmsProjectDepartment" (
    "projectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProjectDepartment_pkey" PRIMARY KEY ("projectId","departmentId")
);

CREATE INDEX "HbmsProjectDepartment_departmentId_idx" ON "HbmsProjectDepartment"("departmentId");

ALTER TABLE "HbmsProjectDepartment" ADD CONSTRAINT "HbmsProjectDepartment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsProjectDepartment" ADD CONSTRAINT "HbmsProjectDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
