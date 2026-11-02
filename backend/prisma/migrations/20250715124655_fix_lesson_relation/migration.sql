/*
  Warnings:

  - You are about to drop the column `progress` on the `Lesson` table. All the data in the column will be lost.
  - Added the required column `description` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_userId_fkey";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "progress",
ADD COLUMN     "description" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
