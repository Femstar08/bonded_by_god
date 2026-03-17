-- Section content: add writable content body and word count to sections.
-- Previously, sections were planning metadata only (title, status, summary, notes).
-- This migration enables sections to hold actual editor content.

ALTER TABLE ltu_sections ADD COLUMN content TEXT DEFAULT '';
ALTER TABLE ltu_sections ADD COLUMN word_count INTEGER DEFAULT 0;
