import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer } from 'docx'
import type { Chapter, Project } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportRequestBody {
  chapterId: string
  projectId: string
  format: 'pdf' | 'docx'
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
 * Builds the base filename (without extension) from project and chapter titles.
 * Format: {project-title}-{chapter-title}
 */
function buildFilename(projectTitle: string, chapterTitle: string): string {
  return `${toFilenameSlug(projectTitle)}-${toFilenameSlug(chapterTitle)}`
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
// PDF generation
// ---------------------------------------------------------------------------

/**
 * Generates a PDF buffer from the given project and chapter data.
 *
 * Layout:
 *   - Project title  — large, bold (Helvetica-Bold 26pt)
 *   - Chapter title  — medium (Helvetica-Bold 18pt)
 *   - Thin separator line
 *   - Body paragraphs (Helvetica 12pt, 1.5× line spacing)
 *   - Footer: "Created with Scriptloom" (small, centred)
 */
async function generatePDF(project: Project, chapter: Chapter): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, bufferPages: true })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 72 * 2 // subtract left + right margins

    // --- Project title ---
    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .text(project.title, { align: 'left', width: contentWidth })

    doc.moveDown(0.5)

    // --- Chapter title ---
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(chapter.title, { align: 'left', width: contentWidth })

    doc.moveDown(0.75)

    // --- Separator line ---
    const lineY = doc.y
    doc
      .moveTo(72, lineY)
      .lineTo(pageWidth - 72, lineY)
      .lineWidth(0.75)
      .strokeColor('#cccccc')
      .stroke()

    doc.moveDown(1)

    // --- Body paragraphs ---
    const paragraphs = splitIntoParagraphs(chapter.content || '')

    doc.font('Helvetica').fontSize(12).fillColor('#000000')

    paragraphs.forEach((para, index) => {
      doc.text(para, {
        align: 'justify',
        width: contentWidth,
        lineGap: 4,
      })

      // Add spacing between paragraphs (but not after the very last one)
      if (index < paragraphs.length - 1) {
        doc.moveDown(0.8)
      }
    })

    // --- Footer on every page ---
    // bufferPages: true lets us iterate pages after doc.end()
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)

      const footerY = doc.page.height - 50
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#888888')
        .text('Created with Scriptloom', 72, footerY, {
          align: 'center',
          width: contentWidth,
        })
    }

    doc.end()
  })
}

// ---------------------------------------------------------------------------
// DOCX generation
// ---------------------------------------------------------------------------

/**
 * Generates a DOCX buffer from the given project and chapter data.
 *
 * Structure:
 *   - Project title  — Heading 1
 *   - Chapter title  — Heading 2
 *   - Body paragraphs — Normal paragraphs
 *   - Footer: "Created with Scriptloom"
 */
async function generateDOCX(project: Project, chapter: Chapter): Promise<Buffer> {
  const paragraphs = splitIntoParagraphs(chapter.content || '')

  const bodyParagraphs: Paragraph[] = paragraphs.map(
    (para) =>
      new Paragraph({
        children: [new TextRun({ text: para, size: 24 })], // 12pt = 24 half-points
        spacing: { after: 200 }, // ~10pt spacing after each paragraph
      })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Created with Scriptloom',
                    size: 16, // 8pt = 16 half-points
                    color: '888888',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Project title — Heading 1
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: project.title, bold: true })],
            spacing: { after: 240 },
          }),

          // Chapter title — Heading 2
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: chapter.title })],
            spacing: { after: 360 },
          }),

          // Body content
          ...bodyParagraphs,
        ],
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

    const { chapterId, projectId, format } = body

    if (!chapterId || !projectId || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: chapterId, projectId, and format are all required' },
        { status: 400 }
      )
    }

    if (format !== 'pdf' && format !== 'docx') {
      return NextResponse.json(
        { error: 'Invalid format. Must be "pdf" or "docx"' },
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

    // --- Fetch chapter ---
    const { data: chapter, error: chapterError } = await supabase
      .from('ltu_chapters')
      .select('*')
      .eq('id', chapterId)
      .single()

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found. It may have been deleted or you may not have access.' },
        { status: 404 }
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

    // --- Confirm the chapter belongs to the requested project ---
    if (chapter.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Chapter does not belong to the specified project.' },
        { status: 404 }
      )
    }

    // --- Generate document ---
    const filename = buildFilename(project.title, chapter.title)

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(project as Project, chapter as Chapter)
      // Slice to a clean ArrayBuffer — required by the web-standard BodyInit type
      const responseBody: ArrayBuffer = pdfBuffer.buffer.slice(
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

    // format === 'docx'
    const docxBuffer = await generateDOCX(project as Project, chapter as Chapter)
    // Slice to a clean ArrayBuffer — required by the web-standard BodyInit type
    const responseBody: ArrayBuffer = docxBuffer.buffer.slice(
      docxBuffer.byteOffset,
      docxBuffer.byteOffset + docxBuffer.byteLength
    ) as ArrayBuffer

    return new Response(responseBody, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
