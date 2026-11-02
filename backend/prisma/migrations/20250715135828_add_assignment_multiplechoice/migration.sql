/*
  Warnings:

  - You are about to drop the column `assignment` on the `Topic` table. All the data in the column will be lost.
  - You are about to drop the column `mark` on the `Topic` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY');

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "assignment",
DROP COLUMN "mark";

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "type" "AssignmentType" NOT NULL,
    "topicId" INTEGER NOT NULL,
    "mark" INTEGER NOT NULL,
    "correctOption" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultipleChoiceOption" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "assignmentId" INTEGER NOT NULL,

    CONSTRAINT "MultipleChoiceOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultipleChoiceOption" ADD CONSTRAINT "MultipleChoiceOption_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
