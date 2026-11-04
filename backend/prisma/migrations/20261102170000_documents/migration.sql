CREATE TYPE "HbmsDocumentCategory" AS ENUM ('CONTRACT', 'REQUIREMENTS', 'CLIENT_AGREEMENT', 'DELIVERABLE', 'TRAINING', 'INTERNSHIP_REPORT', 'PRODUCTION', 'POLICY', 'MINUTES');

CREATE TYPE "HbmsDocumentSensitivity" AS ENUM ('INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

CREATE TYPE "HbmsFileStorage" AS ENUM ('OBJECT', 'PRIVATE');

CREATE TABLE "HbmsDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "HbmsDocumentCategory" NOT NULL,
    "sensitivity" "HbmsDocumentSensitivity" NOT NULL DEFAULT 'INTERNAL',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storage" "HbmsFileStorage" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "employeeId" TEXT,
    "projectId" TEXT,
    "programId" TEXT,
    "meetingId" TEXT,
    "businessUnitId" TEXT,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HbmsDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HbmsDocumentGrant" (
    "documentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "HbmsDocumentGrant_pkey" PRIMARY KEY ("documentId","employeeId")
);

CREATE INDEX "HbmsDocument_category_idx" ON "HbmsDocument"("category");
CREATE INDEX "HbmsDocument_sensitivity_idx" ON "HbmsDocument"("sensitivity");
CREATE INDEX "HbmsDocument_employeeId_idx" ON "HbmsDocument"("employeeId");
CREATE INDEX "HbmsDocument_projectId_idx" ON "HbmsDocument"("projectId");
CREATE INDEX "HbmsDocument_programId_idx" ON "HbmsDocument"("programId");
CREATE INDEX "HbmsDocument_meetingId_idx" ON "HbmsDocument"("meetingId");
CREATE INDEX "HbmsDocument_businessUnitId_idx" ON "HbmsDocument"("businessUnitId");
CREATE INDEX "HbmsDocumentGrant_employeeId_idx" ON "HbmsDocumentGrant"("employeeId");

ALTER TABLE "HbmsDocument" ADD CONSTRAINT "HbmsDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsDocument" ADD CONSTRAINT "HbmsDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsDocument" ADD CONSTRAINT "HbmsDocument_programId_fkey" FOREIGN KEY ("programId") REFERENCES "HbmsProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsDocument" ADD CONSTRAINT "HbmsDocument_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "HbmsMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsDocument" ADD CONSTRAINT "HbmsDocument_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsDocumentGrant" ADD CONSTRAINT "HbmsDocumentGrant_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "HbmsDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HbmsDocumentGrant" ADD CONSTRAINT "HbmsDocumentGrant_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
