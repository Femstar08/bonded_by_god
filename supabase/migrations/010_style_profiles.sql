-- Style Profiles — stores analyzed writing style at user-level and project-level
-- user-level: project_id IS NULL (applies to all projects unless overridden)
-- project-level: project_id IS NOT NULL (overrides user-level for that project)

CREATE TABLE IF NOT EXISTS ltu_style_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES ltu_projects(id) ON DELETE CASCADE,
  style_data      JSONB NOT NULL DEFAULT '{}',
  samples_text    TEXT[] DEFAULT '{}',
  word_count_at_analysis  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- One user-level profile per user, one project-level profile per (user, project)
CREATE UNIQUE INDEX idx_style_profiles_user_level
  ON ltu_style_profiles (user_id)
  WHERE project_id IS NULL;

CREATE UNIQUE INDEX idx_style_profiles_project_level
  ON ltu_style_profiles (user_id, project_id)
  WHERE project_id IS NOT NULL;

-- RLS
ALTER TABLE ltu_style_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own style profiles"
  ON ltu_style_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_style_profiles
  BEFORE UPDATE ON ltu_style_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
