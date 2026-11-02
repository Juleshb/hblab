-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active';
