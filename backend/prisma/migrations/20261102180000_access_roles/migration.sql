CREATE TYPE "HbmsAccessRole" AS ENUM ('SUPER_ADMIN', 'CEO', 'DEPARTMENT_MANAGER', 'PROJECT_MANAGER', 'HR', 'PROGRAM_COORDINATOR', 'TRAINER', 'WORKER', 'INTERN', 'CLIENT');

CREATE TABLE "HbmsUserRole" (
    "userId" INTEGER NOT NULL,
    "role" "HbmsAccessRole" NOT NULL,

    CONSTRAINT "HbmsUserRole_pkey" PRIMARY KEY ("userId","role")
);

CREATE TABLE "HbmsClientAccess" (
    "userId" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "HbmsClientAccess_pkey" PRIMARY KEY ("userId","projectId")
);

CREATE INDEX "HbmsUserRole_role_idx" ON "HbmsUserRole"("role");
CREATE INDEX "HbmsClientAccess_projectId_idx" ON "HbmsClientAccess"("projectId");

ALTER TABLE "HbmsUserRole" ADD CONSTRAINT "HbmsUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsClientAccess" ADD CONSTRAINT "HbmsClientAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsClientAccess" ADD CONSTRAINT "HbmsClientAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
