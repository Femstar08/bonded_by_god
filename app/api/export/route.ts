import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageBreak,
  PageNumber,
} from 'docx'
import type { Chapter, Project } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExportScope = 'chapter' | 'part' | 'project'

interface ExportRequestBody {
  projectId: string
  format: 'pdf' | 'docx'
  /** Defaults to 'chapter' for backward compatibility. */
  scope?: ExportScope
  /** Required when scope === 'chapter'. */
  chapterId?: string
  /** Required when scope === 'part'. */
  partId?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitises a string for use as a filename component.
 * Converts to lowercase, replaces whitespace runs with hyphens, and strips
 * any character that is not alphanumeric or a hyphen.
 */
function toFilenameSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Splits chapter content into non-empty paragraphs.
 * Handles both HTML content (from Tiptap) and plain text.
 */
function splitIntoParagraphs(content: string): string[] {
  if (!content) return []
  // HTML content — extract text from paragraph/heading/blockquote tags
  if (/<[a-z][\s\S]*>/i.test(content)) {
    const blocks: string[] = []
    // Match block-level elements and extract their text content
    const blockRegex = /<(p|h[1-6]|blockquote|li)[^>]*>([\s\S]*?)<\/\1>/gi
    let match
    while ((match = blockRegex.exec(content)) !== null) {
      const text = match[2]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .trim()
      if (text) blocks.push(text)
    }
    if (blocks.length > 0) return blocks
    // Fallback: strip all tags
    const stripped = content.replace(/<[^>]*>/g, '').trim()
    return stripped ? stripped.split(/\n{2,}/).map(p => p.trim()).filter(Boolean) : []
  }
  // Plain text
  return content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

// ---------------------------------------------------------------------------
// PDF generation — single chapter (backward-compatible)
// ---------------------------------------------------------------------------

/**
 * Generates a PDF buffer from a single project and chapter.
 * Includes page numbers at the bottom-center of every page.
 */
async function generateChapterPDF(project: Project, chapter: Chapter): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, bufferPages: true })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => {
      addPageNumbers(doc)
      resolve(Buffer.concat(chunks))
    })
    doc.on('error', reject)

    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 72 * 2

    // Project title
    doc.font('Helvetica-Bold').fontSize(26).text(project.title, { align: 'left', width: contentWidth })
    doc.moveDown(0.5)

    // Chapter title
    doc.font('Helvetica-Bold').fontSize(18).text(chapter.title, { align: 'left', width: contentWidth })
    doc.moveDown(0.75)

    // Separator line
    const lineY = doc.y
    doc.moveTo(72, lineY).lineTo(pageWidth - 72, lineY).lineWidth(0.75).strokeColor('#cccccc').stroke()
    doc.moveDown(1)

    // Body paragraphs
    renderBodyParagraphs(doc, chapter.content || '', contentWidth)

    doc.end()
  })
}

// ---------------------------------------------------------------------------
// PDF generation — multi-chapter (part or full project)
// ---------------------------------------------------------------------------

/**
 * Renders body paragraphs for a chapter into an existing PDF document.
 */
function renderBodyParagraphs(
  doc: InstanceType<typeof PDFDocument>,
  content: string,
  contentWidth: number
): void {
  const paragraphs = splitIntoParagraphs(content)
  doc.font('Helvetica').fontSize(12).fillColor('#000000')

  paragraphs.forEach((para, index) => {
    doc.text(para, { align: 'justify', width: contentWidth, lineGap: 4 })
    if (index < paragraphs.length - 1) {
      doc.moveDown(0.8)
    }
  })
}

/**
 * Adds page numbers and "Created with Scriptloom" footer text to all buffered pages.
 * Must be called before doc.end() is awaited (i.e., in the 'end' event handler,
 * or synchronously after all content has been written but before doc.end()).
 *
 * Because pdfkit fires the 'end' event after flushing, we call this synchronously
 * just before doc.end() so the buffered range is final.
 */
function addPageFooters(doc: InstanceType<typeof PDFDocument>): void {
  const range = doc.bufferedPageRange()
  const totalPages = range.count

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i)

    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 72 * 2
    const footerY = doc.page.height - 50

    // "Created with Scriptloom" — left-aligned within center area
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#888888')
      .text('Created with Scriptloom', 72, footerY, {
        align: 'center',
        width: contentWidth,
      })

    // Page number — "Page X of Y"
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text(`Page ${i - range.start + 1}`, 72, footerY - 16, {
        align: 'center',
        width: contentWidth,
      })
  }
}

// Alias used by the single-chapter path (old name preserved for internal clarity)
function addPageNumbers(doc: InstanceType<typeof PDFDocument>): void {
  addPageFooters(doc)
}

/**
 * Renders a part title page into the PDF document.
 * Adds a new page (unless it is the very first page with no content yet),
 * then centers the part title vertically and horizontally.
 */
function renderPartTitlePage(
  doc: InstanceType<typeof PDFDocument>,
  partTitle: string,
  isFirst: boolean
): void {
  if (!isFirst) {
    doc.addPage()
  }

  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  const contentWidth = pageWidth - 72 * 2

  // Center the title vertically
  const titleY = pageHeight / 2 - 30

  doc
    .font('Helvetica-Bold')
    .fontSize(32)
    .fillColor('#1a1a1a')
    .text(partTitle, 72, titleY, {
      align: 'center',
      width: contentWidth,
    })
}

/**
 * Generates a PDF for a part: title page + optional intro + all chapters.
 */
async function generatePartPDF(
  project: Project,
  part: Chapter,
  chapters: Chapter[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, bufferPages: true })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => {
      addPageFooters(doc)
      resolve(Buffer.concat(chunks))
    })
    doc.on('error', reject)

    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 72 * 2

    // Project title at the very top
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#1a1a1a')
      .text(project.title, { align: 'center', width: contentWidth })
    doc.moveDown(0.5)

    // Part title page
    renderPartTitlePage(doc, part.title, false)

    // Part intro content (if any)
    if (part.content && part.content.trim()) {
      doc.addPage()
      renderBodyParagraphs(doc, part.content, contentWidth)
    }

    // Each chapter
    chapters.forEach((chapter) => {
      doc.addPage()

      // Chapter heading
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a1a1a')
        .text(chapter.title, { align: 'left', width: contentWidth })
      doc.moveDown(0.75)

      // Separator
      const lineY = doc.y
      doc.moveTo(72, lineY).lineTo(pageWidth - 72, lineY).lineWidth(0.75).strokeColor('#cccccc').stroke()
      doc.moveDown(1)

      // Body
      renderBodyParagraphs(doc, chapter.content || '', contentWidth)
    })

    doc.end()
  })
}

/**
 * Generates a PDF for the full project.
 * Parts get title pages; chapters get their content rendered in order.
 */
async function generateProjectPDF(
  project: Project,
  allChapters: Chapter[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, bufferPages: true })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => {
      addPageFooters(doc)
      resolve(Buffer.concat(chunks))
    })
    doc.on('error', reject)

    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 72 * 2

    // Cover page: project title
    const coverTitleY = doc.page.height / 2 - 40
    doc
      .font('Helvetica-Bold')
      .fontSize(32)
      .fillColor('#1a1a1a')
      .text(project.title, 72, coverTitleY, { align: 'center', width: contentWidth })

    let isFirst = true

    allChapters.forEach((item) => {
      if (item.type === 'part') {
        // Part title page
        renderPartTitlePage(doc, item.title, false)
        isFirst = false

        // Part intro content
        if (item.content && item.content.trim()) {
          doc.addPage()
          renderBodyParagraphs(doc, item.content, contentWidth)
        }
      } else {
        // Regular chapter
        if (isFirst) {
          doc.addPage()
          isFirst = false
        } else {
          doc.addPage()
        }

        doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a1a1a')
          .text(item.title, { align: 'left', width: contentWidth })
        doc.moveDown(0.75)

        const lineY = doc.y
        doc.moveTo(72, lineY).lineTo(pageWidth - 72, lineY).lineWidth(0.75).strokeColor('#cccccc').stroke()
        doc.moveDown(1)

        renderBodyParagraphs(doc, item.content || '', contentWidth)
      }
    })

    doc.end()
  })
}

// ---------------------------------------------------------------------------
// DOCX generation — single chapter (backward-compatible)
// ---------------------------------------------------------------------------

/**
 * Generates a DOCX buffer from the given project and chapter data.
 * Includes a page number field in the footer.
 */
async function generateChapterDOCX(project: Project, chapter: Chapter): Promise<Buffer> {
  const paragraphs = splitIntoParagraphs(chapter.content || '')

  const bodyParagraphs: Paragraph[] = paragraphs.map(
    (para) =>
      new Paragraph({
        children: [new TextRun({ text: para, size: 24 })],
        spacing: { after: 200 },
      })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: buildDocxFooter(),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: project.title, bold: true })],
            spacing: { after: 240 },
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: chapter.title })],
            spacing: { after: 360 },
          }),
          ...bodyParagraphs,
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// ---------------------------------------------------------------------------
// DOCX generation — multi-chapter (part or full project)
// ---------------------------------------------------------------------------

/**
 * Builds the standard footer used in all DOCX exports.
 * Includes "Created with Scriptloom" and an automatic page number field.
 */
function buildDocxFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'Created with Scriptloom   |   Page ',
            size: 16,
            color: '888888',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 16,
            color: '888888',
          }),
        ],
      }),
    ],
  })
}

/**
 * Converts chapter body content into an array of DOCX Paragraph nodes.
 */
function buildBodyParagraphs(content: string): Paragraph[] {
  return splitIntoParagraphs(content).map(
    (para) =>
      new Paragraph({
        children: [new TextRun({ text: para, size: 24 })],
        spacing: { after: 200 },
      })
  )
}

/**
 * Builds a part title section for DOCX: a page break, centered Heading 1.
 */
function buildPartTitleParagraphs(partTitle: string): Paragraph[] {
  return [
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: partTitle,
          bold: true,
          size: 64, // 32pt = 64 half-points
        }),
      ],
      spacing: { before: 2880, after: 2880 }, // ~2 inches of breathing room
    }),
  ]
}

/**
 * Generates a DOCX for a part: title page + optional intro + all chapters.
 */
async function generatePartDOCX(
  project: Project,
  part: Chapter,
  chapters: Chapter[]
): Promise<Buffer> {
  const children: Paragraph[] = [
    // Project title
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: project.title, bold: true })],
      spacing: { after: 480 },
    }),

    // Part title page
    ...buildPartTitleParagraphs(part.title),
  ]

  // Part intro content
  if (part.content && part.content.trim()) {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(...buildBodyParagraphs(part.content))
  }

  // Each chapter
  chapters.forEach((chapter) => {
    children.push(new Paragraph({ children: [new PageBreak()] }))
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: chapter.title, bold: true })],
        spacing: { after: 360 },
      })
    )
    children.push(...buildBodyParagraphs(chapter.content || ''))
  })

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: { default: buildDocxFooter() },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}

/**
 * Generates a DOCX for the full project.
 * Parts get title pages; chapters get content in order.
 */
async function generateProjectDOCX(
  project: Project,
  allChapters: Chapter[]
): Promise<Buffer> {
  const children: Paragraph[] = [
    // Cover: project title, vertically centred via large spacing
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: project.title, bold: true, size: 72 })],
      spacing: { before: 4320, after: 4320 }, // ~3 inches top + bottom
    }),
  ]

  allChapters.forEach((item) => {
    if (item.type === 'part') {
      children.push(...buildPartTitleParagraphs(item.title))

      if (item.content && item.content.trim()) {
        children.push(new Paragraph({ children: [new PageBreak()] }))
        children.push(...buildBodyParagraphs(item.content))
      }
    } else {
      children.push(new Paragraph({ children: [new PageBreak()] }))
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: item.title, bold: true })],
          spacing: { after: 360 },
        })
      )
      children.push(...buildBodyParagraphs(item.content || ''))
    }
  })

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: { default: buildDocxFooter() },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // --- Parse and validate request body ---
    let body: Partial<ExportRequestBody>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { projectId, format, scope = 'chapter', chapterId, partId } = body

    if (!projectId || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId and format are required' },
        { status: 400 }
      )
    }

    if (format !== 'pdf' && format !== 'docx') {
      return NextResponse.json(
        { error: 'Invalid format. Must be "pdf" or "docx"' },
        { status: 400 }
      )
    }

    if (scope === 'chapter' && !chapterId) {
      return NextResponse.json(
        { error: 'chapterId is required when scope is "chapter"' },
        { status: 400 }
      )
    }

    if (scope === 'part' && !partId) {
      return NextResponse.json(
        { error: 'partId is required when scope is "part"' },
        { status: 400 }
      )
    }

    // --- Authenticate user ---
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorised. Please sign in to export documents.' },
        { status: 401 }
      )
    }

    // --- Fetch project (scoped to the authenticated user for security) ---
    const { data: project, error: projectError } = await supabase
      .from('ltu_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to access it.' },
        { status: 404 }
      )
    }

    const projectSlug = toFilenameSlug(project.title)

    // -----------------------------------------------------------------------
    // Scope: chapter (backward-compatible single-chapter export)
    // -----------------------------------------------------------------------
    if (scope === 'chapter') {
      const { data: chapter, error: chapterError } = await supabase
        .from('ltu_chapters')
        .select('*')
        .eq('id', chapterId!)
        .single()

      if (chapterError || !chapter) {
        return NextResponse.json(
          { error: 'Chapter not found. It may have been deleted or you may not have access.' },
          { status: 404 }
        )
      }

      if (chapter.project_id !== projectId) {
        return NextResponse.json(
          { error: 'Chapter does not belong to the specified project.' },
          { status: 404 }
        )
      }

      const chapterSlug = toFilenameSlug(chapter.title)
      const filename = `${projectSlug}-${chapterSlug}`

      if (format === 'pdf') {
        const pdfBuffer = await generateChapterPDF(project as Project, chapter as Chapter)
        const responseBody = pdfBuffer.buffer.slice(
          pdfBuffer.byteOffset,
          pdfBuffer.byteOffset + pdfBuffer.byteLength
        ) as ArrayBuffer

        return new Response(responseBody, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}.pdf"`,
            'Content-Length': pdfBuffer.byteLength.toString(),
          },
        })
      }

      const docxBuffer = await generateChapterDOCX(project as Project, chapter as Chapter)
      const responseBody = docxBuffer.buffer.slice(
        docxBuffer.byteOffset,
        docxBuffer.byteOffset + docxBuffer.byteLength
      ) as ArrayBuffer

      return new Response(responseBody, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}.docx"`,
          'Content-Length': docxBuffer.byteLength.toString(),
        },
      })
    }

    // -----------------------------------------------------------------------
    // Scope: part
    // -----------------------------------------------------------------------
    if (scope === 'part') {
      // Fetch the part row itself
      const { data: part, error: partError } = await supabase
        .from('ltu_chapters')
        .select('*')
        .eq('id', partId!)
        .eq('project_id', projectId)
        .single()

      if (partError || !part) {
        return NextResponse.json(
          { error: 'Part not found or does not belong to the specified project.' },
          { status: 404 }
        )
      }

      // Fetch all chapters that belong to this part, ordered by position
      const { data: partChapters, error: chaptersError } = await supabase
        .from('ltu_chapters')
        .select('*')
        .eq('project_id', projectId)
        .eq('parent_id', partId!)
        .eq('type', 'chapter')
        .order('position', { ascending: true })

      if (chaptersError) {
        return NextResponse.json(
          { error: 'Failed to fetch chapters for the specified part.' },
          { status: 500 }
        )
      }

      const partSlug = toFilenameSlug(part.title)
      const filename = `${projectSlug}-${partSlug}`
      const chapters = (partChapters ?? []) as Chapter[]

      if (format === 'pdf') {
        const pdfBuffer = await generatePartPDF(project as Project, part as Chapter, chapters)
        const responseBody = pdfBuffer.buffer.slice(
          pdfBuffer.byteOffset,
          pdfBuffer.byteOffset + pdfBuffer.byteLength
        ) as ArrayBuffer

        return new Response(responseBody, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}.pdf"`,
            'Content-Length': pdfBuffer.byteLength.toString(),
          },
        })
      }

      const docxBuffer = await generatePartDOCX(project as Project, part as Chapter, chapters)
      const responseBody = docxBuffer.buffer.slice(
        docxBuffer.byteOffset,
        docxBuffer.byteOffset + docxBuffer.byteLength
      ) as ArrayBuffer

      return new Response(responseBody, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}.docx"`,
          'Content-Length': docxBuffer.byteLength.toString(),
        },
      })
    }

    // -----------------------------------------------------------------------
    // Scope: project (full export)
    // -----------------------------------------------------------------------
    // scope === 'project'
    const { data: allChapters, error: allChaptersError } = await supabase
      .from('ltu_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    if (allChaptersError || !allChapters) {
      return NextResponse.json(
        { error: 'Failed to fetch chapters for the project.' },
        { status: 500 }
      )
    }

    const filename = projectSlug

    if (format === 'pdf') {
      const pdfBuffer = await generateProjectPDF(project as Project, allChapters as Chapter[])
      const responseBody = pdfBuffer.buffer.slice(
        pdfBuffer.byteOffset,
        pdfBuffer.byteOffset + pdfBuffer.byteLength
      ) as ArrayBuffer

      return new Response(responseBody, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
        },
      })
    }

    const docxBuffer = await generateProjectDOCX(project as Project, allChapters as Chapter[])
    const responseBody = docxBuffer.buffer.slice(
      docxBuffer.byteOffset,
      docxBuffer.byteOffset + docxBuffer.byteLength
    ) as ArrayBuffer

    return new Response(responseBody, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
        'Content-Length': docxBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Export route error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Export failed: ${message}` },
      { status: 500 }
    )
  }
}
