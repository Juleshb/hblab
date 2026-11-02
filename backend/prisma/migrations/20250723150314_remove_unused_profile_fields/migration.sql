/*
  Warnings:

  - You are about to drop the column `awards` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `certificatesCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `parentName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `parentPhone` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "awards",
DROP COLUMN "certificatesCount",
DROP COLUMN "emergencyContact",
DROP COLUMN "parentName",
DROP COLUMN "parentPhone";
