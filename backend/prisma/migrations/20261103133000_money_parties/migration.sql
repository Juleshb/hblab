CREATE TYPE "HbmsMoneyParty" AS ENUM ('CLIENT', 'MEMBER');

ALTER TABLE "HbmsPayment" ADD COLUMN "payerKind" "HbmsMoneyParty",
ADD COLUMN "payerId" TEXT,
ADD COLUMN "receiverKind" "HbmsMoneyParty",
ADD COLUMN "receiverId" TEXT;

ALTER TABLE "HbmsExpense" ADD COLUMN "spentByKind" "HbmsMoneyParty",
ADD COLUMN "spentById" TEXT;

CREATE INDEX "HbmsPayment_payerId_idx" ON "HbmsPayment"("payerId");
CREATE INDEX "HbmsPayment_receiverId_idx" ON "HbmsPayment"("receiverId");
CREATE INDEX "HbmsExpense_spentById_idx" ON "HbmsExpense"("spentById");

ALTER TABLE "HbmsPayment" ADD CONSTRAINT "HbmsPayment_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsPayment" ADD CONSTRAINT "HbmsPayment_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HbmsExpense" ADD CONSTRAINT "HbmsExpense_spentById_fkey" FOREIGN KEY ("spentById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
