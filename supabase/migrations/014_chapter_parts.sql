-- Add 'type' column to ltu_chapters to support Parts (grouping headers above chapters)
ALTER TABLE ltu_chapters
  ADD COLUMN type TEXT NOT NULL DEFAULT 'chapter'
  CHECK (type IN ('chapter', 'part'));
