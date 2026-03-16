-- Visual Chapter Planner: add planning columns to chapters and sections

-- Add visual planner columns to ltu_chapters
ALTER TABLE ltu_chapters
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS synopsis TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS color_label TEXT DEFAULT NULL;

-- Add status constraint for chapters (applied separately to avoid lock contention on ADD COLUMN)
ALTER TABLE ltu_chapters
  ADD CONSTRAINT ltu_chapters_status_check
    CHECK (status IN ('not_started', 'in_progress', 'draft', 'revision', 'complete'));

-- Add synopsis to sections
ALTER TABLE ltu_sections
  ADD COLUMN IF NOT EXISTS synopsis TEXT DEFAULT '';

-- Index for status-based queries on chapters
CREATE INDEX IF NOT EXISTS idx_ltu_chapters_status ON ltu_chapters(project_id, status);
