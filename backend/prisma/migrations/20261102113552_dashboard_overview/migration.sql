-- CreateEnum
CREATE TYPE "HbmsProjectCategory" AS ENUM ('SOFTWARE', 'WEBSITE', 'PHOTOGRAPHY', 'VIDEO', 'MARKETING', 'OTHER');

-- CreateEnum
CREATE TYPE "HbmsProgramKind" AS ENUM ('COURSE', 'INTERNSHIP', 'WORKSHOP');

-- CreateEnum
CREATE TYPE "HbmsProgramStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "HbmsProject" ADD COLUMN     "category" "HbmsProjectCategory" NOT NULL DEFAULT 'SOFTWARE';

-- CreateTable
CREATE TABLE "HbmsProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "HbmsProgramKind" NOT NULL,
    "status" "HbmsProgramStatus" NOT NULL DEFAULT 'PLANNED',
    "businessUnitId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsAttendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "hours" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsLeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HbmsExpense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "description" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HbmsProgram_businessUnitId_status_idx" ON "HbmsProgram"("businessUnitId", "status");

-- CreateIndex
CREATE INDEX "HbmsAttendance_workDate_idx" ON "HbmsAttendance"("workDate");

-- CreateIndex
CREATE UNIQUE INDEX "HbmsAttendance_employeeId_workDate_key" ON "HbmsAttendance"("employeeId", "workDate");

-- CreateIndex
CREATE INDEX "HbmsLeaveRequest_status_idx" ON "HbmsLeaveRequest"("status");

-- CreateIndex
CREATE INDEX "HbmsExpense_status_idx" ON "HbmsExpense"("status");

-- CreateIndex
CREATE INDEX "HbmsProject_category_idx" ON "HbmsProject"("category");

-- AddForeignKey
ALTER TABLE "HbmsProgram" ADD CONSTRAINT "HbmsProgram_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsAttendance" ADD CONSTRAINT "HbmsAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsLeaveRequest" ADD CONSTRAINT "HbmsLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HbmsExpense" ADD CONSTRAINT "HbmsExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
