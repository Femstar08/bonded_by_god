/**
 * Scripture reference normalisation utility.
 * Expands abbreviations, normalises casing and formatting.
 */

const ABBREVIATION_MAP: Record<string, string> = {
  // Old Testament
  gen: 'Genesis', ge: 'Genesis',
  exo: 'Exodus', exod: 'Exodus', ex: 'Exodus',
  lev: 'Leviticus', le: 'Leviticus',
  num: 'Numbers', nu: 'Numbers',
  deut: 'Deuteronomy', deu: 'Deuteronomy', dt: 'Deuteronomy',
  josh: 'Joshua', jos: 'Joshua',
  judg: 'Judges', jdg: 'Judges',
  ruth: 'Ruth', ru: 'Ruth',
  '1sam': '1 Samuel', '1sa': '1 Samuel',
  '2sam': '2 Samuel', '2sa': '2 Samuel',
  '1kings': '1 Kings', '1kgs': '1 Kings', '1ki': '1 Kings',
  '2kings': '2 Kings', '2kgs': '2 Kings', '2ki': '2 Kings',
  '1chronicles': '1 Chronicles', '1chr': '1 Chronicles', '1chron': '1 Chronicles',
  '2chronicles': '2 Chronicles', '2chr': '2 Chronicles', '2chron': '2 Chronicles',
  ezra: 'Ezra', ezr: 'Ezra',
  neh: 'Nehemiah', nehemiah: 'Nehemiah',
  est: 'Esther', esther: 'Esther',
  job: 'Job',
  ps: 'Psalms', psa: 'Psalms', psalm: 'Psalms', psalms: 'Psalms',
  prov: 'Proverbs', pro: 'Proverbs', pr: 'Proverbs',
  eccl: 'Ecclesiastes', eccles: 'Ecclesiastes', ecc: 'Ecclesiastes',
  song: 'Song of Solomon', sos: 'Song of Solomon', 'song of solomon': 'Song of Solomon',
  isa: 'Isaiah', isaiah: 'Isaiah',
  jer: 'Jeremiah', jeremiah: 'Jeremiah',
  lam: 'Lamentations', lamentations: 'Lamentations',
  ezek: 'Ezekiel', eze: 'Ezekiel', ezekiel: 'Ezekiel',
  dan: 'Daniel', daniel: 'Daniel',
  hos: 'Hosea', hosea: 'Hosea',
  joel: 'Joel',
  amos: 'Amos', am: 'Amos',
  obad: 'Obadiah', ob: 'Obadiah', obadiah: 'Obadiah',
  jon: 'Jonah', jonah: 'Jonah',
  mic: 'Micah', micah: 'Micah',
  nah: 'Nahum', nahum: 'Nahum',
  hab: 'Habakkuk', habakkuk: 'Habakkuk',
  zeph: 'Zephaniah', zep: 'Zephaniah', zephaniah: 'Zephaniah',
  hag: 'Haggai', haggai: 'Haggai',
  zech: 'Zechariah', zec: 'Zechariah', zechariah: 'Zechariah',
  mal: 'Malachi', malachi: 'Malachi',

  // New Testament
  matt: 'Matthew', mat: 'Matthew', mt: 'Matthew', matthew: 'Matthew',
  mark: 'Mark', mk: 'Mark', mr: 'Mark',
  luke: 'Luke', lk: 'Luke', lu: 'Luke',
  john: 'John', jn: 'John', joh: 'John',
  acts: 'Acts', act: 'Acts',
  rom: 'Romans', ro: 'Romans', romans: 'Romans',
  '1cor': '1 Corinthians', '1co': '1 Corinthians',
  '2cor': '2 Corinthians', '2co': '2 Corinthians',
  gal: 'Galatians', galatians: 'Galatians',
  eph: 'Ephesians', ephesians: 'Ephesians',
  phil: 'Philippians', php: 'Philippians', philippians: 'Philippians',
  col: 'Colossians', colossians: 'Colossians',
  '1thess': '1 Thessalonians', '1th': '1 Thessalonians',
  '2thess': '2 Thessalonians', '2th': '2 Thessalonians',
  '1tim': '1 Timothy', '1ti': '1 Timothy',
  '2tim': '2 Timothy', '2ti': '2 Timothy',
  tit: 'Titus', titus: 'Titus',
  phlm: 'Philemon', phm: 'Philemon', philemon: 'Philemon',
  heb: 'Hebrews', hebrews: 'Hebrews',
  jas: 'James', james: 'James',
  '1pet': '1 Peter', '1pe': '1 Peter',
  '2pet': '2 Peter', '2pe': '2 Peter',
  '1john': '1 John', '1jn': '1 John',
  '2john': '2 John', '2jn': '2 John',
  '3john': '3 John', '3jn': '3 John',
  jude: 'Jude',
  rev: 'Revelation', revelation: 'Revelation',
}

// Full book names for direct matching (case-insensitive)
const FULL_BOOK_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther',
  'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians',
  'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]

export type ParsedReference = {
  book: string
  chapter: number
  verse?: number
  endVerse?: number
}

/**
 * Normalise a Scripture reference string to canonical format.
 * e.g. "rom 8:28" → "Romans 8:28", "ps 23" → "Psalms 23"
 */
export function normaliseScriptureReference(input: string): string | null {
  const parsed = parseReference(input)
  if (!parsed) return null

  let result = parsed.book + ' ' + parsed.chapter
  if (parsed.verse != null) {
    result += ':' + parsed.verse
    if (parsed.endVerse != null) {
      result += '-' + parsed.endVerse
    }
  }
  return result
}

/**
 * Parse a Scripture reference string into structured components.
 */
export function parseReference(input: string): ParsedReference | null {
  if (!input || !input.trim()) return null

  let text = input.trim()
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\./g, '')

  // Extract the numeric prefix for numbered books (e.g. "1" from "1 Cor")
  let numPrefix = ''
  const numPrefixMatch = text.match(/^([123])\s*/)
  if (numPrefixMatch) {
    numPrefix = numPrefixMatch[1]
    text = text.slice(numPrefixMatch[0].length)
  }

  // Split into book part and chapter:verse part
  // Find where the first digit starts (that isn't part of the book name)
  const chapterMatch = text.match(/\s+(\d+.*)$/)
  let bookPart: string
  let chapterVersePart: string | undefined

  if (chapterMatch) {
    bookPart = text.slice(0, chapterMatch.index!).trim()
    chapterVersePart = chapterMatch[1].trim()
  } else {
    // No chapter/verse — just a book name
    bookPart = text
  }

  // Resolve the book name
  const lookupKey = (numPrefix ? numPrefix + bookPart : bookPart).toLowerCase()
  let book: string | undefined = ABBREVIATION_MAP[lookupKey]

  // If no match, try matching the full book part directly
  if (!book) {
    const fullKey = (numPrefix ? numPrefix + ' ' + bookPart : bookPart).toLowerCase()
    book = FULL_BOOK_NAMES.find(b => b.toLowerCase() === fullKey)
  }

  if (!book) return null

  if (!chapterVersePart) {
    // Book-only reference (e.g. "Genesis") — not a valid verse reference
    return null
  }

  // Parse chapter:verse-endVerse
  const cvMatch = chapterVersePart.match(/^(\d+)(?:\s*:\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!cvMatch) return null

  const chapter = parseInt(cvMatch[1], 10)
  const verse = cvMatch[2] ? parseInt(cvMatch[2], 10) : undefined
  const endVerse = cvMatch[3] ? parseInt(cvMatch[3], 10) : undefined

  return { book, chapter, verse, endVerse }
}

/**
 * Generate a cache-safe key from a reference string.
 * e.g. "Romans 8:28" → "romans-8-28"
 */
export function referenceToCacheKey(reference: string): string {
  return reference.toLowerCase().replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '')
}
