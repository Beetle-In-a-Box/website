/*
  Warnings:

  - Added the required column `previewText` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "previewText" TEXT NOT NULL;
