import type { RepurposeFormat } from '@/types/repurposing'

/**
 * Format-specific generation instructions for the Content Repurposing Engine.
 * Each prompt tells the AI exactly how to transform the source content
 * into the target format while preserving the author's voice and message.
 */

const ROLE_TONE_MODIFIERS: Record<string, Record<RepurposeFormat, string>> = {
  preacher: {
    twitter: 'Use a proclamatory, bold tone. Lead with the key truth.',
    instagram: 'Use a proclamatory tone with pastoral warmth. Open with the key message.',
    facebook: 'Write as a pastor sharing truth with a congregation. Be warm but authoritative.',
    discussion_guide: 'Use sermon-structure language. Questions should move from observation to application.',
    youth_version: 'Simplify the sermon language but keep the fire and conviction.',
    email_newsletter: 'Write as a pastor writing to a congregation. Be direct and encouraging.',
    devotional_extract: 'Each day should feel like sitting with a trusted pastor. Be direct yet gentle.',
    blog_post: 'Write with the authority of a seasoned preacher sharing hard-won wisdom.',
  },
  devotionalist: {
    twitter: 'Use an intimate, reflective tone. Share a quiet truth.',
    instagram: 'Use a meditative, journaling tone. Invite the reader into reflection.',
    facebook: 'Write as sharing a personal journal entry with a trusted friend.',
    discussion_guide: 'Frame questions around personal reflection and inner spiritual life.',
    youth_version: 'Keep the reflective warmth but use relatable, everyday language.',
    email_newsletter: 'Write with pastoral warmth and intimate, personal tone.',
    devotional_extract: 'Use intimate, journalistic tone. Each day is a personal spiritual encounter.',
    blog_post: 'Write with the gentle depth of someone sharing a devotional journey.',
  },
  author: {
    twitter: 'Use a literary excerpt style. Let the writing speak for itself.',
    instagram: 'Share as a literary excerpt with narrative context.',
    facebook: 'Write as an author sharing insight from the creative process.',
    discussion_guide: 'Frame questions around themes, narrative arcs, and theological insights.',
    youth_version: 'Simplify while preserving the narrative quality and depth.',
    email_newsletter: 'Write as an author sharing with readers — personal, narrative-driven.',
    devotional_extract: 'Each day draws from the book\'s themes with narrative structure.',
    blog_post: 'Use narrative structure. Write as a thoughtful author exploring ideas publicly.',
  },
  content_creator: {
    twitter: 'Use engagement-optimised language. Hook with the opening line.',
    instagram: 'Maximise engagement with a strong hook and strategic hashtags.',
    facebook: 'Write for engagement — ask questions, invite comments, share value.',
    discussion_guide: 'Frame as a small group resource with clear takeaways.',
    youth_version: 'Use current, relatable language. Be conversational and authentic.',
    email_newsletter: 'Write for clicks and engagement. Clear CTA, scannable format.',
    devotional_extract: 'Make each day actionable and shareable. Include social-ready quotes.',
    blog_post: 'Write for SEO and sharing. Use subheadings, lists, and strong hooks.',
  },
}

function getRoleTone(role: string, format: RepurposeFormat): string {
  const normalised = role.toLowerCase().replace(/[^a-z_]/g, '')
  const modifiers = ROLE_TONE_MODIFIERS[normalised]
  if (modifiers?.[format]) return `\nRole-specific tone: ${modifiers[format]}`
  return ''
}

export function getRepurposeInstructions(format: RepurposeFormat, role: string): string {
  const roleTone = getRoleTone(role, format)

  const instructions: Record<RepurposeFormat, string> = {
    twitter: `Convert the source content into a single Twitter/X post.

Rules:
• Maximum 280 characters — this is a hard limit, count carefully
• Capture the single most powerful truth or insight from the source
• No hashtags unless they fit naturally within the character limit
• Do not use quotation marks around the entire post
• Make it impactful enough to stand alone without context
${roleTone}

Return ONLY the tweet text. Nothing else.`,

    instagram: `Convert the source content into an Instagram caption.

Rules:
• Maximum 2,200 characters
• Open with a hook that stops the scroll
• Break into short, readable paragraphs (1-3 sentences each)
• Include 2-3 relevant Scripture references woven naturally into the text
• End with a call to engagement (question, invitation, or reflection prompt)
• Add a line break, then 8-12 relevant hashtags on the final line
• Hashtags should mix broad (#faith #christianliving) and niche (#ministrylife #sermonnotes)
${roleTone}

Return ONLY the caption text with hashtags. Nothing else.`,

    facebook: `Convert the source content into a Facebook post.

Rules:
• Maximum 500 words
• Conversational, warm tone — as if speaking to your community
• Open with a relatable hook or personal observation
• Include 1-2 Scripture references
• End with an invitation to engage (question, prayer request, or reflection)
• Use short paragraphs for readability
• No hashtags
${roleTone}

Return ONLY the post text. Nothing else.`,

    discussion_guide: `Create a small group discussion guide from the source content.

Rules:
• Generate 5-8 open-ended discussion questions
• Each question must reference at least one Scripture passage (book, chapter, verse)
• Questions should progress from observation → interpretation → application
• Include a brief introduction paragraph (2-3 sentences) setting the theme
• Include a closing prayer prompt
• Format each question with a number and the Scripture reference in parentheses
• Questions should invite honest, vulnerable discussion — not simple yes/no answers
${roleTone}

Format the output as:

INTRODUCTION
[2-3 sentences]

DISCUSSION QUESTIONS
1. [Question] (Scripture reference)
2. [Question] (Scripture reference)
...

CLOSING PRAYER
[Brief prayer prompt]`,

    youth_version: `Rewrite the source content for a youth audience (ages 13-18).

Rules:
• Same core message and theological content — do not water down the truth
• Reading level appropriate for teenagers
• Shorter sentences, simpler vocabulary
• Use relatable examples and modern language (but not forced slang)
• Keep Scripture references but explain them in accessible terms
• Break up long paragraphs
• Aim for 60-75% of the original length
${roleTone}

Return ONLY the simplified version. Nothing else.`,

    email_newsletter: `Convert the source content into an email newsletter draft.

Rules:
• Start with a subject line on the first line, prefixed with "Subject: "
• Follow with a blank line, then the email body
• Open with a personal, warm greeting
• Body should be scannable — use short paragraphs, bold key phrases if needed
• Include 1-2 Scripture references
• End with a clear call to action (reply, click, reflect, share)
• Keep total body under 400 words
• Suitable for platforms like Mailchimp, ConvertKit, or Substack
${roleTone}

Format:

Subject: [Subject line]

[Email body]`,

    devotional_extract: `Create a multi-day devotional series from the source content.

Rules:
• Generate a 3-5 day devotional series (choose the count that best fits the source depth)
• Each day must include:
  - A short title (3-6 words)
  - An opening Scripture reference (full book, chapter, verse)
  - A reflection paragraph (100-200 words) that connects the Scripture to the source message
  - A closing prayer prompt (1-2 sentences)
• Each day should build on the previous one, creating a spiritual progression
• The series should have an overarching theme drawn from the source content
• Maintain theological accuracy and spiritual depth
${roleTone}

Format each day as:

DAY [N]: [Title]
Scripture: [Reference]

[Reflection paragraph]

Prayer: [Prayer prompt]

---`,

    blog_post: `Adapt the source content into a blog post for the web.

Rules:
• Target length: 600-900 words
• Write an SEO-friendly introductory paragraph that hooks the reader and previews the content
• Use 3-5 subheadings (H2 level, marked with ##) to structure the post
• Include 2-3 Scripture references woven naturally into the text
• End with a conclusion paragraph that includes a call to reflection or action
• Write for a general Christian audience, not just the author's existing readers
• Tone should be accessible but not shallow
${roleTone}

Return ONLY the blog post text with ## subheadings. Nothing else.`,
  }

  return instructions[format]
}
