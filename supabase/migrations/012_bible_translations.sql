-- Bible Translation Comparison preferences on user profiles
ALTER TABLE ltu_profiles
  ADD COLUMN IF NOT EXISTS preferred_translation TEXT NOT NULL DEFAULT 'NIV';

ALTER TABLE ltu_profiles
  ADD COLUMN IF NOT EXISTS bible_comparison_layout TEXT NOT NULL DEFAULT 'side_by_side';

ALTER TABLE ltu_profiles
  ADD COLUMN IF NOT EXISTS bible_translations_count INTEGER NOT NULL DEFAULT 3;
