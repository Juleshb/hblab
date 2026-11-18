-- Stores the 5,000 RWF internship application fee until PawaPay confirms it.
CREATE TABLE "InternshipPayment" (
    "id" SERIAL NOT NULL,
    "depositId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 5000,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "provider" TEXT NOT NULL,
    "payerPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "failureReason" TEXT,
    "payload" JSONB NOT NULL,
    "applicationId" INTEGER,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InternshipPayment_depositId_key" ON "InternshipPayment"("depositId");
CREATE UNIQUE INDEX "InternshipPayment_applicationId_key" ON "InternshipPayment"("applicationId");

ALTER TABLE "InternshipPayment" ADD CONSTRAINT "InternshipPayment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CareerApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
