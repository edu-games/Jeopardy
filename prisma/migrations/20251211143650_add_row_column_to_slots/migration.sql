-- AlterTable: Add row and column fields, populate from existing data, then drop position field

-- Step 1: Add new columns with temporary defaults
ALTER TABLE "BoardQuestionSlot" ADD COLUMN IF NOT EXISTS "row" INTEGER;
ALTER TABLE "BoardQuestionSlot" ADD COLUMN IF NOT EXISTS "column" INTEGER;

-- Step 2: Populate row from existing position field (only if position column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'BoardQuestionSlot' AND column_name = 'position') THEN
        UPDATE "BoardQuestionSlot" SET "row" = "position";
    END IF;
END $$;

-- Step 3: Populate column from category order
UPDATE "BoardQuestionSlot" bqs
SET "column" = c."order"
FROM "Category" c
WHERE bqs."categoryId" = c.id;

-- Step 4: Make row and column NOT NULL now that they have values
ALTER TABLE "BoardQuestionSlot" ALTER COLUMN "row" SET NOT NULL;
ALTER TABLE "BoardQuestionSlot" ALTER COLUMN "column" SET NOT NULL;

-- Step 5: Drop the old position field and constraint (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint
               WHERE conname = 'BoardQuestionSlot_categoryId_position_key') THEN
        ALTER TABLE "BoardQuestionSlot" DROP CONSTRAINT "BoardQuestionSlot_categoryId_position_key";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'BoardQuestionSlot' AND column_name = 'position') THEN
        ALTER TABLE "BoardQuestionSlot" DROP COLUMN "position";
    END IF;
END $$;

-- Step 6: Create new unique constraint (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'BoardQuestionSlot_categoryId_row_key') THEN
        ALTER TABLE "BoardQuestionSlot" ADD CONSTRAINT "BoardQuestionSlot_categoryId_row_key" UNIQUE("categoryId", "row");
    END IF;
END $$;
