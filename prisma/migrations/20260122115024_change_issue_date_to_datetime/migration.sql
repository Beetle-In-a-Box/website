-- AlterTable Issue: Change date from String to DateTime
-- This migration converts existing "Month Year" format strings (e.g., "August 2025") to DateTime

-- Step 1: Add a temporary column for the new DateTime value
ALTER TABLE "Issue" ADD COLUMN "date_temp" TIMESTAMP(3);

-- Step 2: Convert existing string dates to DateTime
-- Assumes dates are in "Month Year" format like "August 2025" or "January 2026"
-- Converts to first day of that month
UPDATE "Issue" SET "date_temp" =
  CASE
    WHEN "date" ~ '^[A-Za-z]+ [0-9]{4}$' THEN
      TO_TIMESTAMP("date", 'Month YYYY')
    ELSE
      NOW() -- Fallback for any malformed dates
  END;

-- Step 3: Drop the old string column
ALTER TABLE "Issue" DROP COLUMN "date";

-- Step 4: Rename the temp column to "date"
ALTER TABLE "Issue" RENAME COLUMN "date_temp" TO "date";

-- Step 5: Make the column NOT NULL
ALTER TABLE "Issue" ALTER COLUMN "date" SET NOT NULL;

-- Step 6: Add index on date column
CREATE INDEX "Issue_date_idx" ON "Issue"("date");
