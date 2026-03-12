/**
 * Regex-based Bible reference extractor.
 * Fast and deterministic — no AI call needed.
 */

// Book name patterns (covers standard + abbreviated forms)
const BOOK_NAMES = [
  // Old Testament
  'Genesis', 'Gen\\.?', 'Exodus', 'Exod?\\.?', 'Leviticus', 'Lev\\.?',
  'Numbers', 'Num\\.?', 'Deuteronomy', 'Deut?\\.?',
  'Joshua', 'Josh\\.?', 'Judges', 'Judg?\\.?', 'Ruth',
  '1\\s*Samuel', '1\\s*Sam\\.?', '2\\s*Samuel', '2\\s*Sam\\.?',
  '1\\s*Kings', '1\\s*Kgs\\.?', '2\\s*Kings', '2\\s*Kgs\\.?',
  '1\\s*Chronicles', '1\\s*Chr(?:on)?\\.?', '2\\s*Chronicles', '2\\s*Chr(?:on)?\\.?',
  'Ezra', 'Nehemiah', 'Neh\\.?', 'Esther', 'Est\\.?',
  'Job', 'Psalms?', 'Ps\\.?', 'Proverbs', 'Prov?\\.?',
  'Ecclesiastes', 'Eccl(?:es)?\\.?', 'Song\\s*of\\s*Solomon', 'Song\\.?', 'Songs?\\.?',
  'Isaiah', 'Isa\\.?', 'Jeremiah', 'Jer\\.?', 'Lamentations', 'Lam\\.?',
  'Ezekiel', 'Ezek?\\.?', 'Daniel', 'Dan\\.?',
  'Hosea', 'Hos\\.?', 'Joel', 'Amos', 'Obadiah', 'Obad\\.?',
  'Jonah', 'Jon\\.?', 'Micah', 'Mic\\.?', 'Nahum', 'Nah\\.?',
  'Habakkuk', 'Hab\\.?', 'Zephaniah', 'Zeph\\.?',
  'Haggai', 'Hag\\.?', 'Zechariah', 'Zech?\\.?', 'Malachi', 'Mal\\.?',
  // New Testament
  'Matthew', 'Matt?\\.?', 'Mark', 'Mk\\.?', 'Luke', 'Lk\\.?',
  'John', 'Jn\\.?', 'Acts',
  'Romans', 'Rom\\.?',
  '1\\s*Corinthians', '1\\s*Cor\\.?', '2\\s*Corinthians', '2\\s*Cor\\.?',
  'Galatians', 'Gal\\.?', 'Ephesians', 'Eph\\.?',
  'Philippians', 'Phil\\.?', 'Colossians', 'Col\\.?',
  '1\\s*Thessalonians', '1\\s*Thess?\\.?', '2\\s*Thessalonians', '2\\s*Thess?\\.?',
  '1\\s*Timothy', '1\\s*Tim\\.?', '2\\s*Timothy', '2\\s*Tim\\.?',
  'Titus', 'Tit\\.?', 'Philemon', 'Phlm\\.?',
  'Hebrews', 'Heb\\.?', 'James', 'Jas\\.?',
  '1\\s*Peter', '1\\s*Pet?\\.?', '2\\s*Peter', '2\\s*Pet?\\.?',
  '1\\s*John', '1\\s*Jn\\.?', '2\\s*John', '2\\s*Jn\\.?', '3\\s*John', '3\\s*Jn\\.?',
  'Jude', 'Revelation', 'Rev\\.?',
]

// Build the full regex pattern
// Matches: "Book Chapter:Verse-Verse" or just "Book Chapter" (e.g., "Psalm 23")
const bookPattern = BOOK_NAMES.join('|')
const SCRIPTURE_REGEX = new RegExp(
  `(?:${bookPattern})\\s+\\d+(?:\\s*:\\s*\\d+(?:\\s*[-–]\\s*\\d+)?)?`,
  'gi'
)

/**
 * Extract scripture references from text using regex.
 * Returns deduplicated, normalized array of references.
 */
export function extractScriptureReferences(text: string): string[] {
  const matches = text.match(SCRIPTURE_REGEX)
  if (!matches) return []

  // Normalize: collapse whitespace, normalize dashes
  const normalized = matches.map((ref) =>
    ref.replace(/\s+/g, ' ').replace(/\s*[–—]\s*/g, '-').trim()
  )

  // Deduplicate (case-insensitive)
  const seen = new Set<string>()
  return normalized.filter((ref) => {
    const key = ref.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
