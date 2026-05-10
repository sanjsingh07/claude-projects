/*
  Warnings:

  - You are about to drop the column `birthDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `birthTime` on the `User` table. All the data in the column will be lost.
  - Added the required column `birthDateTime` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_birthDate_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "birthDate",
DROP COLUMN "birthTime",
ADD COLUMN     "birthDateTime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "User_birthDateTime_idx" ON "User"("birthDateTime");
