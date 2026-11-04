-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('EMPLOYEE', 'INTERN', 'TRAINER', 'CONTRACTOR', 'FREELANCER');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "HbmsProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HbmsProjectRole" AS ENUM ('MANAGER', 'MEMBER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "HbmsTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HbmsTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "HbmsMilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "BusinessUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "businessUnitId" TEXT NOT NULL,
    "departmentId" TEXT,
    "positionId" TEXT,
    "reportsToId" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "businessUnitId" TEXT NOT NULL,
    "managerId" TEXT,
    "status" "HbmsProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "clientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" "HbmsProjectRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "HbmsMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "HbmsTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "HbmsTaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "creatorId" TEXT,
    "parentId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsTaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsTaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsTaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsTaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnit_code_key" ON "BusinessUnit"("code");

-- CreateIndex
CREATE INDEX "BusinessUnit_code_idx" ON "BusinessUnit"("code");

-- CreateIndex
CREATE INDEX "Department_businessUnitId_idx" ON "Department"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_businessUnitId_name_key" ON "Department"("businessUnitId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Position_title_key" ON "Position"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_businessUnitId_idx" ON "Employee"("businessUnitId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "HbmsProject_businessUnitId_idx" ON "HbmsProject"("businessUnitId");

-- CreateIndex
CREATE INDEX "HbmsProject_status_idx" ON "HbmsProject"("status");

-- CreateIndex
CREATE INDEX "HbmsProject_managerId_idx" ON "HbmsProject"("managerId");

-- CreateIndex
CREATE INDEX "HbmsProjectMember_employeeId_idx" ON "HbmsProjectMember"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "HbmsProjectMember_projectId_employeeId_key" ON "HbmsProjectMember"("projectId", "employeeId");

-- CreateIndex
CREATE INDEX "HbmsMilestone_projectId_idx" ON "HbmsMilestone"("projectId");

-- CreateIndex
CREATE INDEX "HbmsMilestone_dueDate_idx" ON "HbmsMilestone"("dueDate");

-- CreateIndex
CREATE INDEX "HbmsTask_projectId_idx" ON "HbmsTask"("projectId");

-- CreateIndex
CREATE INDEX "HbmsTask_status_idx" ON "HbmsTask"("status");

-- CreateIndex
CREATE INDEX "HbmsTask_dueDate_idx" ON "HbmsTask"("dueDate");

-- CreateIndex
CREATE INDEX "HbmsTask_creatorId_idx" ON "HbmsTask"("creatorId");

-- CreateIndex
CREATE INDEX "HbmsTaskAssignee_employeeId_idx" ON "HbmsTaskAssignee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "HbmsTaskAssignee_taskId_employeeId_key" ON "HbmsTaskAssignee"("taskId", "employeeId");

-- CreateIndex
CREATE INDEX "HbmsTaskComment_taskId_idx" ON "HbmsTaskComment"("taskId");

-- CreateIndex
CREATE INDEX "HbmsAuditLog_entityType_entityId_idx" ON "HbmsAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "HbmsAuditLog_createdAt_idx" ON "HbmsAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsProject" ADD CONSTRAINT "HbmsProject_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsProject" ADD CONSTRAINT "HbmsProject_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsProjectMember" ADD CONSTRAINT "HbmsProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsProjectMember" ADD CONSTRAINT "HbmsProjectMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsMilestone" ADD CONSTRAINT "HbmsMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsTask" ADD CONSTRAINT "HbmsTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsTask" ADD CONSTRAINT "HbmsTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsTask" ADD CONSTRAINT "HbmsTask_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "HbmsTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsTaskAssignee" ADD CONSTRAINT "HbmsTaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HbmsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsTaskAssignee" ADD CONSTRAINT "HbmsTaskAssignee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsTaskComment" ADD CONSTRAINT "HbmsTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HbmsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsTaskComment" ADD CONSTRAINT "HbmsTaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
