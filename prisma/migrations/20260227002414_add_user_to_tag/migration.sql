/*
  Warnings:

  - Added the required column `userId` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- Add userId column (nullable first for backfill)
ALTER TABLE "Tag" ADD COLUMN "userId" TEXT;

-- Backfill from first User
UPDATE "Tag" SET "userId" = (SELECT "id" FROM "User" LIMIT 1);

-- Set NOT NULL and add foreign key
ALTER TABLE "Tag" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique index on (userId, slug)
CREATE UNIQUE INDEX "Tag_userId_slug_key" ON "Tag"("userId", "slug");
