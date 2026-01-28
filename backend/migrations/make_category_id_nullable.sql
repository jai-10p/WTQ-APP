-- Migration: Make category_id nullable in exams table
-- Date: 2026-01-28
-- Description: Removes the NOT NULL constraint from category_id column in exams table
--              since categories are no longer required for exams

-- Make category_id nullable
ALTER TABLE exams MODIFY COLUMN category_id INT UNSIGNED NULL;

-- Optional: Set existing NULL values if needed
-- UPDATE exams SET category_id = NULL WHERE category_id = 0;

-- Verify the change
-- DESCRIBE exams;
