-- Citation style preference per project
ALTER TABLE ltu_projects
  ADD COLUMN citation_style TEXT NOT NULL DEFAULT 'chicago'
  CHECK (citation_style IN ('chicago', 'apa', 'mla'));

ALTER TABLE ltu_projects
  ADD COLUMN footnote_style TEXT NOT NULL DEFAULT 'footnote'
  CHECK (footnote_style IN ('footnote', 'endnote'));

-- Citations table — stores all citation sources for a project
CREATE TABLE ltu_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bible', 'book', 'article', 'website', 'dictionary', 'other')),
  -- Common fields
  title TEXT NOT NULL DEFAULT '',
  -- Bible-specific
  bible_reference TEXT,          -- e.g., "John 3:16"
  bible_translation TEXT,        -- e.g., "NIV"
  -- Book fields
  author TEXT,
  editor TEXT,
  publisher TEXT,
  year TEXT,
  edition TEXT,
  pages TEXT,
  city TEXT,
  -- Article fields
  journal TEXT,
  volume TEXT,
  issue TEXT,
  doi TEXT,
  -- Website fields
  url TEXT,
  access_date TEXT,
  site_name TEXT,
  -- Dictionary fields
  dictionary_name TEXT,
  entry_word TEXT,
  -- Metadata
  short_label TEXT,              -- user-friendly label shown in editor, e.g., "Smith 2020"
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ltu_citations_project_id ON ltu_citations(project_id);

-- RLS
ALTER TABLE ltu_citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own citations"
  ON ltu_citations FOR ALL
  USING (
    project_id IN (
      SELECT id FROM ltu_projects WHERE user_id = auth.uid()
    )
  );
