/*
  Warnings:

  - You are about to drop the column `citations` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `previewText` on the `Article` table. All the data in the column will be lost.
  - Added the required column `contentDocxPath` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "citations",
DROP COLUMN "content",
DROP COLUMN "previewText",
ADD COLUMN     "contentDocxPath" TEXT NOT NULL;
