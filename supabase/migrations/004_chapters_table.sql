-- Create chapters table (one row per chapter/section per project)
CREATE TABLE ltu_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Chapter 1',
  content TEXT DEFAULT '',
  position INTEGER DEFAULT 1,
  word_goal INTEGER DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ltu_chapters_project_id ON ltu_chapters(project_id);
CREATE INDEX idx_ltu_chapters_position ON ltu_chapters(project_id, position);

-- Enable Row Level Security
ALTER TABLE ltu_chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chapters (access via project ownership)
CREATE POLICY "Users can view their own chapters"
  ON ltu_chapters FOR SELECT
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own chapters"
  ON ltu_chapters FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own chapters"
  ON ltu_chapters FOR UPDATE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own chapters"
  ON ltu_chapters FOR DELETE
  USING (project_id IN (SELECT id FROM ltu_projects WHERE user_id = auth.uid()));

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ltu_chapters_updated_at
  BEFORE UPDATE ON ltu_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create first chapter when a new project is created
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ltu_chapters (project_id, title, position)
  VALUES (NEW.id, 'Chapter 1', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
  AFTER INSERT ON ltu_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_project();
