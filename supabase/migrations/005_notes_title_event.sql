-- Add title and event_name columns to notes table
ALTER TABLE ltu_notes ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE ltu_notes ADD COLUMN IF NOT EXISTS event_name TEXT;
