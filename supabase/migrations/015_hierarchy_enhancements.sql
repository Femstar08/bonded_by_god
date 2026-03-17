-- Add parent_id to ltu_chapters for explicit part-chapter linking
ALTER TABLE ltu_chapters
  ADD COLUMN parent_id UUID REFERENCES ltu_chapters(id) ON DELETE SET NULL;

CREATE INDEX idx_ltu_chapters_parent_id ON ltu_chapters(parent_id);

-- Add hierarchy_labels to ltu_projects for custom naming
ALTER TABLE ltu_projects
  ADD COLUMN hierarchy_labels JSONB DEFAULT '{"part": "Part", "chapter": "Chapter", "section": "Section"}'::jsonb;
