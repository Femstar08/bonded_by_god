-- Chapter Memory Engine tables
-- Stores AI-generated summaries per chapter and project-level style memory

-- ltu_chapter_memories: one row per chapter, stores AI-generated summary
CREATE TABLE ltu_chapter_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL UNIQUE REFERENCES ltu_chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  key_themes TEXT[] DEFAULT '{}',
  scriptures_used TEXT[] DEFAULT '{}',
  key_ideas TEXT[] DEFAULT '{}',
  word_count_at_generation INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ltu_chapter_memories_project_id ON ltu_chapter_memories(project_id);
CREATE INDEX idx_ltu_chapter_memories_chapter_id ON ltu_chapter_memories(chapter_id);

-- Enable RLS
ALTER TABLE ltu_chapter_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (access via project ownership)
CREATE POLICY "Users can view their own chapter memories"
  ON ltu_chapter_memories FOR SELECT
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own chapter memories"
  ON ltu_chapter_memories FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own chapter memories"
  ON ltu_chapter_memories FOR UPDATE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own chapter memories"
  ON ltu_chapter_memories FOR DELETE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_ltu_chapter_memories_updated_at
  BEFORE UPDATE ON ltu_chapter_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ltu_project_memory: one row per project, stores style + aggregated scriptures
CREATE TABLE ltu_project_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES ltu_projects(id) ON DELETE CASCADE,
  writing_style TEXT NOT NULL DEFAULT '',
  recurring_themes TEXT[] DEFAULT '{}',
  all_scriptures_used TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ltu_project_memory_project_id ON ltu_project_memory(project_id);

-- Enable RLS
ALTER TABLE ltu_project_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies (access via project ownership)
CREATE POLICY "Users can view their own project memory"
  ON ltu_project_memory FOR SELECT
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own project memory"
  ON ltu_project_memory FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own project memory"
  ON ltu_project_memory FOR UPDATE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own project memory"
  ON ltu_project_memory FOR DELETE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_ltu_project_memory_updated_at
  BEFORE UPDATE ON ltu_project_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
