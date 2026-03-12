ALTER TABLE ltu_profiles ADD COLUMN IF NOT EXISTS show_prayer_prompt boolean DEFAULT true;
ALTER TABLE ltu_profiles ADD COLUMN IF NOT EXISTS show_daily_scripture boolean DEFAULT true;
ALTER TABLE ltu_projects ADD COLUMN IF NOT EXISTS inspiration_images text[] DEFAULT '{}';
