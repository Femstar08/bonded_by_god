-- Writing Map: sections within chapters
-- Sections are planning metadata that track what a chapter should contain.

CREATE TABLE ltu_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES ltu_chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'draft', 'review', 'complete')),
  summary TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  position INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ltu_sections_chapter_id ON ltu_sections(chapter_id);
CREATE INDEX idx_ltu_sections_project_id ON ltu_sections(project_id);
CREATE INDEX idx_ltu_sections_position ON ltu_sections(chapter_id, position);

-- Enable RLS
ALTER TABLE ltu_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (access via project ownership)
CREATE POLICY "Users can view their own sections"
  ON ltu_sections FOR SELECT
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own sections"
  ON ltu_sections FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own sections"
  ON ltu_sections FOR UPDATE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own sections"
  ON ltu_sections FOR DELETE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_ltu_sections_updated_at
  BEFORE UPDATE ON ltu_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
