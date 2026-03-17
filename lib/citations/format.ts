import { Citation, CitationStyle } from '@/types/database'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Wrap a string in italic markdown markers when the string is non-empty.
 * Used so callers can easily produce *Title* style output.
 */
function italics(value: string | null | undefined): string {
  if (!value) return ''
  return `*${value}*`
}

/** Return `value` if it is a non-empty string, otherwise return `fallback`. */
function or(value: string | null | undefined, fallback = ''): string {
  return value && value.trim() ? value.trim() : fallback
}

// ---------------------------------------------------------------------------
// Chicago / Turabian (Notes-Bibliography)
// ---------------------------------------------------------------------------

function chicagoBible(c: Citation): string {
  const ref = or(c.bible_reference)
  const trans = or(c.bible_translation)
  if (!ref) return ''
  return trans ? `${ref} (${trans}).` : `${ref}.`
}

function chicagoBook(c: Citation): string {
  const author = or(c.author)
  const title = italics(or(c.title))
  const city = or(c.city)
  const publisher = or(c.publisher)
  const year = or(c.year)

  const place = city && publisher ? `${city}: ${publisher}` : publisher || city
  const placeYear = place && year ? `${place}, ${year}` : place || year

  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (placeYear) parts.push(placeYear)

  return parts.join('. ') + '.'
}

function chicagoArticle(c: Citation): string {
  const author = or(c.author)
  const title = or(c.title) ? `"${or(c.title)}"` : ''
  const journal = italics(or(c.journal))
  const vol = or(c.volume)
  const issue = or(c.issue)
  const year = or(c.year)
  const pages = or(c.pages)

  // e.g. "Vol 3, no. 2 (2020): 45–60"
  let citation = ''
  if (vol && issue) citation = `${vol}, no. ${issue}`
  else if (vol) citation = vol

  const yearStr = year ? `(${year})` : ''
  const volYear = [citation, yearStr].filter(Boolean).join(' ')
  const volYearPages = [journal, volYear, pages ? pages : ''].filter(Boolean).join(': ').replace(/: $/, '')

  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (volYearPages) parts.push(volYearPages)

  return parts.join('. ') + '.'
}

function chicagoWebsite(c: Citation): string {
  const author = or(c.author)
  const title = or(c.title) ? `"${or(c.title)}"` : ''
  const siteName = or(c.site_name)
  const url = or(c.url)
  const accessed = or(c.access_date)

  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (siteName) parts.push(siteName)
  if (url) parts.push(url)
  if (accessed) parts.push(`Accessed ${accessed}`)

  return parts.join('. ') + '.'
}

function chicagoDictionary(c: Citation): string {
  const dictName = italics(or(c.dictionary_name))
  const entry = or(c.entry_word) ? `"${or(c.entry_word)}"` : ''

  if (dictName && entry) return `${dictName}, s.v. ${entry}.`
  if (dictName) return `${dictName}.`
  return entry ? `s.v. ${entry}.` : ''
}

function chicagoOther(c: Citation): string {
  const author = or(c.author)
  const title = italics(or(c.title))
  const year = or(c.year)
  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (year) parts.push(year)
  return parts.join('. ') + '.'
}

// ---------------------------------------------------------------------------
// APA (7th edition)
// ---------------------------------------------------------------------------

function apaBible(c: Citation): string {
  const ref = or(c.bible_reference)
  const trans = or(c.bible_translation)
  if (!ref) return ''
  return trans ? `${ref} (${trans}).` : `${ref}.`
}

function apaBook(c: Citation): string {
  const author = or(c.author)
  const year = or(c.year)
  const title = italics(or(c.title))
  const edition = or(c.edition)
  const publisher = or(c.publisher)

  // Title with edition: *Title* (2nd ed.)
  const titleEd = edition ? `${title} (${edition} ed.)` : title

  const parts: string[] = []
  if (author) parts.push(author)
  if (year) parts.push(`(${year})`)
  if (titleEd) parts.push(titleEd)
  if (publisher) parts.push(publisher)

  return parts.join('. ') + '.'
}

function apaArticle(c: Citation): string {
  const author = or(c.author)
  const year = or(c.year)
  const title = or(c.title)
  const journal = italics(or(c.journal))
  const vol = or(c.volume) ? italics(or(c.volume)) : ''
  const issue = or(c.issue) ? `(${or(c.issue)})` : ''
  const pages = or(c.pages)
  const doi = or(c.doi)

  // e.g. "Journal Name, 3(2), 45–60. https://doi.org/..."
  const volIssue = vol && issue ? `${vol}${issue}` : vol || ''
  const volIssuePage = [journal, volIssue, pages].filter(Boolean).join(', ')

  const parts: string[] = []
  if (author) parts.push(author)
  if (year) parts.push(`(${year})`)
  if (title) parts.push(title)
  if (volIssuePage) parts.push(volIssuePage)
  if (doi) parts.push(doi)

  return parts.join('. ') + '.'
}

function apaWebsite(c: Citation): string {
  const author = or(c.author)
  const year = or(c.year)
  const title = or(c.title)
  const siteName = or(c.site_name)
  const url = or(c.url)

  const parts: string[] = []
  if (author) parts.push(author)
  if (year) parts.push(`(${year})`)
  if (title) parts.push(title)
  if (siteName) parts.push(siteName)
  if (url) parts.push(url)

  return parts.join('. ') + '.'
}

function apaDictionary(c: Citation): string {
  const entry = or(c.entry_word)
  const year = or(c.year)
  const dictName = italics(or(c.dictionary_name))

  const parts: string[] = []
  if (entry) parts.push(`${entry}.`)
  if (year) parts.push(`(${year}).`)
  if (dictName) parts.push(`In ${dictName}.`)

  return parts.join(' ')
}

function apaOther(c: Citation): string {
  const author = or(c.author)
  const year = or(c.year)
  const title = italics(or(c.title))
  const publisher = or(c.publisher)

  const parts: string[] = []
  if (author) parts.push(author)
  if (year) parts.push(`(${year})`)
  if (title) parts.push(title)
  if (publisher) parts.push(publisher)

  return parts.join('. ') + '.'
}

// ---------------------------------------------------------------------------
// MLA (9th edition)
// ---------------------------------------------------------------------------

function mlaBible(c: Citation): string {
  const ref = or(c.bible_reference)
  const trans = italics(or(c.bible_translation))
  if (!ref) return ''
  return trans ? `${ref}. ${trans}.` : `${ref}.`
}

function mlaBook(c: Citation): string {
  const author = or(c.author)
  const title = italics(or(c.title))
  const publisher = or(c.publisher)
  const year = or(c.year)

  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (publisher) parts.push(publisher)
  if (year) parts.push(year)

  return parts.join('. ') + '.'
}

function mlaArticle(c: Citation): string {
  const author = or(c.author)
  const title = or(c.title) ? `"${or(c.title)}"` : ''
  const journal = italics(or(c.journal))
  const vol = or(c.volume)
  const issue = or(c.issue)
  const year = or(c.year)
  const pages = or(c.pages)

  // e.g. vol. 3, no. 2, 2020, pp. 45–60
  const volStr = vol ? `vol. ${vol}` : ''
  const issueStr = issue ? `no. ${issue}` : ''
  const pageStr = pages ? `pp. ${pages}` : ''
  const details = [journal, volStr, issueStr, year, pageStr].filter(Boolean).join(', ')

  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (details) parts.push(details)

  return parts.join('. ') + '.'
}

function mlaWebsite(c: Citation): string {
  const author = or(c.author)
  const title = or(c.title) ? `"${or(c.title)}"` : ''
  const siteName = italics(or(c.site_name))
  const url = or(c.url)
  const accessed = or(c.access_date)

  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (siteName) parts.push(siteName)
  if (url) parts.push(url)
  if (accessed) parts.push(`Accessed ${accessed}`)

  return parts.join('. ') + '.'
}

function mlaDictionary(c: Citation): string {
  const entry = or(c.entry_word) ? `"${or(c.entry_word)}"` : ''
  const dictName = italics(or(c.dictionary_name))

  if (entry && dictName) return `${entry} ${dictName}.`
  if (entry) return `${entry}.`
  return dictName ? `${dictName}.` : ''
}

function mlaOther(c: Citation): string {
  const author = or(c.author)
  const title = italics(or(c.title))
  const publisher = or(c.publisher)
  const year = or(c.year)

  const parts: string[] = []
  if (author) parts.push(author)
  if (title) parts.push(title)
  if (publisher) parts.push(publisher)
  if (year) parts.push(year)

  return parts.join('. ') + '.'
}

// ---------------------------------------------------------------------------
// Dispatch tables — map (type × style) → formatter
// ---------------------------------------------------------------------------

type Formatter = (c: Citation) => string

const CHICAGO_FORMATTERS: Record<Citation['type'], Formatter> = {
  bible:      chicagoBible,
  book:       chicagoBook,
  article:    chicagoArticle,
  website:    chicagoWebsite,
  dictionary: chicagoDictionary,
  other:      chicagoOther,
}

const APA_FORMATTERS: Record<Citation['type'], Formatter> = {
  bible:      apaBible,
  book:       apaBook,
  article:    apaArticle,
  website:    apaWebsite,
  dictionary: apaDictionary,
  other:      apaOther,
}

const MLA_FORMATTERS: Record<Citation['type'], Formatter> = {
  bible:      mlaBible,
  book:       mlaBook,
  article:    mlaArticle,
  website:    mlaWebsite,
  dictionary: mlaDictionary,
  other:      mlaOther,
}

const STYLE_MAP: Record<CitationStyle, Record<Citation['type'], Formatter>> = {
  chicago: CHICAGO_FORMATTERS,
  apa:     APA_FORMATTERS,
  mla:     MLA_FORMATTERS,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return a full bibliography-style formatted string for a single citation.
 * The result uses markdown italics (*text*) for publication titles.
 *
 * @param citation - The Citation record from the database.
 * @param style    - One of 'chicago' | 'apa' | 'mla'.
 * @returns        Formatted citation string.
 */
export function formatCitation(citation: Citation, style: CitationStyle): string {
  const formatter = STYLE_MAP[style][citation.type]
  return formatter(citation).trim()
}

/**
 * Return a short inline footnote string suitable for use inside body text.
 * For most types this is a condensed form — Author (Year, page) or
 * equivalent. Falls back to the full bibliography format when a short form
 * cannot be derived.
 *
 * @param citation - The Citation record from the database.
 * @param style    - One of 'chicago' | 'apa' | 'mla'.
 * @returns        Short inline footnote string.
 */
export function formatFootnote(citation: Citation, style: CitationStyle): string {
  const { type } = citation

  if (type === 'bible') {
    // Bible footnotes are the same across all styles
    const ref = or(citation.bible_reference)
    const trans = or(citation.bible_translation)
    if (!ref) return ''
    return trans ? `${ref} (${trans})` : ref
  }

  const author = or(citation.author)
  const year = or(citation.year)
  const pages = or(citation.pages)
  const title = or(citation.title)

  if (style === 'chicago') {
    // Chicago short footnote: Author, *Title* (Year), pages.
    const shortTitle = title ? italics(title) : ''
    const parts: string[] = []
    if (author) parts.push(author)
    if (shortTitle) parts.push(shortTitle)
    const end = [year ? `(${year})` : '', pages].filter(Boolean).join(', ')
    if (end) parts.push(end)
    return parts.join(', ') + '.'
  }

  if (style === 'apa') {
    // APA in-text: (Author, Year, p. X)
    const inner = [author, year, pages ? `p. ${pages}` : ''].filter(Boolean).join(', ')
    return inner ? `(${inner})` : ''
  }

  if (style === 'mla') {
    // MLA in-text: (Author pages)
    const inner = [author, pages].filter(Boolean).join(' ')
    return inner ? `(${inner})` : ''
  }

  // Fallback
  return formatCitation(citation, style)
}

/**
 * Return a sorted array of formatted bibliography strings for a list of
 * citations. The input order is respected (callers should sort before passing
 * if alphabetical order is required).
 *
 * @param citations - Array of Citation records.
 * @param style     - One of 'chicago' | 'apa' | 'mla'.
 * @returns         Array of formatted citation strings in the same order.
 */
export function formatBibliography(citations: Citation[], style: CitationStyle): string[] {
  return citations.map((c) => formatCitation(c, style))
}
