-- Add daily word goal column to existing projects table
ALTER TABLE ltu_projects ADD COLUMN IF NOT EXISTS daily_word_goal integer DEFAULT 500;

-- Create writing sessions table (one row per project per day)
CREATE TABLE ltu_writing_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES ltu_projects(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  word_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, date)
);

-- Indexes for common query patterns
CREATE INDEX idx_ltu_writing_sessions_user_id ON ltu_writing_sessions(user_id);
CREATE INDEX idx_ltu_writing_sessions_project_id ON ltu_writing_sessions(project_id);
CREATE INDEX idx_ltu_writing_sessions_date ON ltu_writing_sessions(date);
CREATE INDEX idx_ltu_writing_sessions_user_date ON ltu_writing_sessions(user_id, date);

-- Enable Row Level Security
ALTER TABLE ltu_writing_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users may only access their own session rows
CREATE POLICY "Users can view their own sessions"
  ON ltu_writing_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON ltu_writing_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON ltu_writing_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON ltu_writing_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Reuse the update_updated_at_column() function created in 001_initial_schema.sql
CREATE TRIGGER set_ltu_writing_sessions_updated_at
  BEFORE UPDATE ON ltu_writing_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
