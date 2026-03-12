export type RepurposeFormat =
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'discussion_guide'
  | 'youth_version'
  | 'email_newsletter'
  | 'devotional_extract'
  | 'blog_post'

export type RepurposeStatus = 'idle' | 'generating' | 'complete' | 'error'

export type RepurposedOutput = {
  format: RepurposeFormat
  content: string
  status: RepurposeStatus
  errorMessage?: string
}

export type RepurposeFormatInfo = {
  id: RepurposeFormat
  name: string
  description: string
  agent: 'scribe' | 'shepherd'
}

export const REPURPOSE_FORMATS: RepurposeFormatInfo[] = [
  {
    id: 'twitter',
    name: 'Twitter / X Post',
    description: 'A concise, impactful post (max 280 characters)',
    agent: 'scribe',
  },
  {
    id: 'instagram',
    name: 'Instagram Caption',
    description: 'Engaging caption with hashtags (max 2,200 characters)',
    agent: 'scribe',
  },
  {
    id: 'facebook',
    name: 'Facebook Post',
    description: 'Conversational post for your community (max 500 words)',
    agent: 'scribe',
  },
  {
    id: 'discussion_guide',
    name: 'Discussion Guide',
    description: '5-8 open-ended questions with Scripture references',
    agent: 'shepherd',
  },
  {
    id: 'youth_version',
    name: 'Youth / Simplified Version',
    description: 'Same message adapted for ages 13-18',
    agent: 'scribe',
  },
  {
    id: 'email_newsletter',
    name: 'Email Newsletter',
    description: 'Subject line + body with a clear call to action',
    agent: 'scribe',
  },
  {
    id: 'devotional_extract',
    name: 'Devotional Series',
    description: '3-5 day devotional with Scripture, reflection, and prayer',
    agent: 'shepherd',
  },
  {
    id: 'blog_post',
    name: 'Blog Post',
    description: 'SEO-friendly web article (600-900 words) with subheadings',
    agent: 'scribe',
  },
]
