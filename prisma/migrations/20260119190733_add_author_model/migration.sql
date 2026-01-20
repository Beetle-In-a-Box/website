-- CreateTable Author
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- AddColumn authorId to Article (nullable for existing records)
ALTER TABLE "Article" ADD COLUMN "authorId" TEXT;

-- DropColumn author from Article
ALTER TABLE "Article" DROP COLUMN "author";

-- AddIndex on Author slug
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");
CREATE INDEX "Author_slug_idx" ON "Author"("slug");

-- AddIndex on Article authorId
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
