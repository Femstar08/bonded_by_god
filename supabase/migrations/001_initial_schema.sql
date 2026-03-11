-- Create enum for project types
CREATE TYPE project_type AS ENUM ('book', 'sermon', 'devotional', 'notes');

-- Create projects table
CREATE TABLE ltu_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type project_type NOT NULL,
  role TEXT NOT NULL,
  content TEXT DEFAULT '',
  structure JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE ltu_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_ltu_projects_user_id ON ltu_projects(user_id);
CREATE INDEX idx_ltu_projects_updated_at ON ltu_projects(updated_at DESC);
CREATE INDEX idx_ltu_notes_user_id ON ltu_notes(user_id);
CREATE INDEX idx_ltu_notes_tags ON ltu_notes USING GIN(tags);
CREATE INDEX idx_ltu_notes_created_at ON ltu_notes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ltu_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltu_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON ltu_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON ltu_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON ltu_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON ltu_projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes"
  ON ltu_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON ltu_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON ltu_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON ltu_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_ltu_projects_updated_at
  BEFORE UPDATE ON ltu_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ltu_notes_updated_at
  BEFORE UPDATE ON ltu_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
