import { HierarchyLabels } from '@/types/database'

/**
 * Role/type-specific label overrides.
 * Keyed by the project `type` value from the `ProjectType` union.
 */
const DEFAULTS: Record<string, HierarchyLabels> = {
  sermon: { part: 'Series', chapter: 'Sermon', section: 'Point' },
}

/** Used when a project has no stored labels and no type-specific default. */
const FALLBACK: HierarchyLabels = { part: 'Part', chapter: 'Chapter', section: 'Section' }

/**
 * Resolve the hierarchy labels for a project.
 *
 * Resolution order:
 * 1. `project.hierarchy_labels` — custom labels saved to the DB (highest priority)
 * 2. `DEFAULTS[project.type]` — type-specific sensible defaults
 * 3. `FALLBACK` — generic English labels
 */
export function getHierarchyLabels(
  project: { hierarchy_labels?: HierarchyLabels | null; type?: string }
): HierarchyLabels {
  if (project.hierarchy_labels) return project.hierarchy_labels
  return DEFAULTS[project.type ?? ''] ?? FALLBACK
}
