CREATE TABLE "HbmsPayment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "paidOn" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HbmsPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HbmsPayment_projectId_idx" ON "HbmsPayment"("projectId");

ALTER TABLE "HbmsPayment" ADD CONSTRAINT "HbmsPayment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "HbmsProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
