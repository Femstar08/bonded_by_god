-- Expand project_type enum with new content category values
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'bible_study';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'article';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'other';

-- Add project creation flow fields to ltu_projects
-- audience: intended audience description for the project
ALTER TABLE ltu_projects ADD COLUMN IF NOT EXISTS audience TEXT;

-- tone: writing or delivery tone (e.g., mentor, teacher, preacher, writer)
ALTER TABLE ltu_projects ADD COLUMN IF NOT EXISTS tone TEXT;

-- scripture_focus: primary scripture reference(s) the project centers on
ALTER TABLE ltu_projects ADD COLUMN IF NOT EXISTS scripture_focus TEXT;
