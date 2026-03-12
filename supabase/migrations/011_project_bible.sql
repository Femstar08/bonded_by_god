-- Project Bible: structured knowledge base per project
CREATE TABLE ltu_project_bible_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  category        TEXT NOT NULL
                    CHECK (category IN (
                      'theological_positions',
                      'themes',
                      'key_figures',
                      'core_scriptures',
                      'audience_profile',
                      'tone_voice_notes',
                      'custom_notes'
                    )),
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  scripture_refs  TEXT[] DEFAULT '{}',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ltu_project_bible_project_id
  ON ltu_project_bible_entries(project_id);

CREATE INDEX idx_ltu_project_bible_category
  ON ltu_project_bible_entries(project_id, category);

CREATE INDEX idx_ltu_project_bible_fts
  ON ltu_project_bible_entries
  USING GIN(to_tsvector('english', title || ' ' || content));

ALTER TABLE ltu_project_bible_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project bible entries"
  ON ltu_project_bible_entries FOR SELECT
  USING (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own project bible entries"
  ON ltu_project_bible_entries FOR INSERT
  WITH CHECK (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own project bible entries"
  ON ltu_project_bible_entries FOR UPDATE
  USING (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own project bible entries"
  ON ltu_project_bible_entries FOR DELETE
  USING (project_id IN (
    SELECT id FROM ltu_projects WHERE user_id = auth.uid()
  ));

CREATE TRIGGER set_updated_at_project_bible_entries
  BEFORE UPDATE ON ltu_project_bible_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
