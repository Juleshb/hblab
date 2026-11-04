ALTER TYPE "HbmsProgramKind" ADD VALUE IF NOT EXISTS 'SOFTWARE_TRAINING';
ALTER TYPE "HbmsProgramKind" ADD VALUE IF NOT EXISTS 'MEDIA_TRAINING';
ALTER TYPE "HbmsProgramKind" ADD VALUE IF NOT EXISTS 'HOLIDAY';
ALTER TYPE "HbmsProgramKind" ADD VALUE IF NOT EXISTS 'HACKATHON';

ALTER TABLE "HbmsProgram" ADD COLUMN "description" TEXT;
ALTER TABLE "HbmsProgram" ADD COLUMN "objectives" TEXT;
ALTER TABLE "HbmsProgram" ADD COLUMN "coordinatorId" TEXT;
ALTER TABLE "HbmsProgram" ADD COLUMN "capacity" INTEGER;
ALTER TABLE "HbmsProgram" ADD COLUMN "outcomes" TEXT;

CREATE INDEX "HbmsProgram_coordinatorId_idx" ON "HbmsProgram"("coordinatorId");

ALTER TABLE "HbmsProgram" ADD CONSTRAINT "HbmsProgram_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "HbmsTrainerRole" AS ENUM ('TRAINER', 'FACILITATOR');
CREATE TYPE "HbmsEnrollmentStatus" AS ENUM ('REGISTERED', 'ACTIVE', 'COMPLETED', 'WITHDRAWN');
CREATE TYPE "HbmsAssignmentKind" AS ENUM ('ASSIGNMENT', 'ASSESSMENT', 'PROJECT');
CREATE TYPE "HbmsSubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'GRADED');

CREATE TABLE "HbmsParticipant" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HbmsParticipant_email_key" ON "HbmsParticipant"("email");
CREATE UNIQUE INDEX "HbmsParticipant_employeeId_key" ON "HbmsParticipant"("employeeId");

ALTER TABLE "HbmsParticipant" ADD CONSTRAINT "HbmsParticipant_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramTrainer" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" "HbmsTrainerRole" NOT NULL DEFAULT 'TRAINER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProgramTrainer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HbmsProgramTrainer_programId_employeeId_key" ON "HbmsProgramTrainer"("programId", "employeeId");
CREATE INDEX "HbmsProgramTrainer_employeeId_idx" ON "HbmsProgramTrainer"("employeeId");

ALTER TABLE "HbmsProgramTrainer" ADD CONSTRAINT "HbmsProgramTrainer_programId_fkey" FOREIGN KEY ("programId") REFERENCES "HbmsProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsProgramTrainer" ADD CONSTRAINT "HbmsProgramTrainer_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramSession" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProgramSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsProgramSession_programId_startsAt_idx" ON "HbmsProgramSession"("programId", "startsAt");

ALTER TABLE "HbmsProgramSession" ADD CONSTRAINT "HbmsProgramSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "HbmsProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramEnrollment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "HbmsEnrollmentStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProgramEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HbmsProgramEnrollment_programId_participantId_key" ON "HbmsProgramEnrollment"("programId", "participantId");
CREATE INDEX "HbmsProgramEnrollment_participantId_idx" ON "HbmsProgramEnrollment"("participantId");

ALTER TABLE "HbmsProgramEnrollment" ADD CONSTRAINT "HbmsProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "HbmsProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsProgramEnrollment" ADD CONSTRAINT "HbmsProgramEnrollment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "HbmsParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,

    CONSTRAINT "HbmsProgramAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HbmsProgramAttendance_sessionId_participantId_key" ON "HbmsProgramAttendance"("sessionId", "participantId");
CREATE INDEX "HbmsProgramAttendance_participantId_idx" ON "HbmsProgramAttendance"("participantId");

ALTER TABLE "HbmsProgramAttendance" ADD CONSTRAINT "HbmsProgramAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HbmsProgramSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsProgramAttendance" ADD CONSTRAINT "HbmsProgramAttendance_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "HbmsParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramMaterial" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProgramMaterial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsProgramMaterial_programId_idx" ON "HbmsProgramMaterial"("programId");

ALTER TABLE "HbmsProgramMaterial" ADD CONSTRAINT "HbmsProgramMaterial_programId_fkey" FOREIGN KEY ("programId") REFERENCES "HbmsProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramAssignment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "HbmsAssignmentKind" NOT NULL DEFAULT 'ASSIGNMENT',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProgramAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsProgramAssignment_programId_idx" ON "HbmsProgramAssignment"("programId");
CREATE INDEX "HbmsProgramAssignment_dueDate_idx" ON "HbmsProgramAssignment"("dueDate");

ALTER TABLE "HbmsProgramAssignment" ADD CONSTRAINT "HbmsProgramAssignment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "HbmsProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "HbmsSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "feedback" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsProgramSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HbmsProgramSubmission_assignmentId_participantId_key" ON "HbmsProgramSubmission"("assignmentId", "participantId");
CREATE INDEX "HbmsProgramSubmission_participantId_idx" ON "HbmsProgramSubmission"("participantId");

ALTER TABLE "HbmsProgramSubmission" ADD CONSTRAINT "HbmsProgramSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "HbmsProgramAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsProgramSubmission" ADD CONSTRAINT "HbmsProgramSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "HbmsParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HbmsProgramReport" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsProgramReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsProgramReport_programId_idx" ON "HbmsProgramReport"("programId");

ALTER TABLE "HbmsProgramReport" ADD CONSTRAINT "HbmsProgramReport_programId_fkey" FOREIGN KEY ("programId") REFERENCES "HbmsProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
