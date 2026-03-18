-- Add editor_font column to ltu_projects for per-project font selection
alter table ltu_projects
  add column if not exists editor_font text default 'dm-serif';
