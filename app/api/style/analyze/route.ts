import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeStyle, aggregateStyle } from '@/lib/agents/stylist'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { samples } = body as { samples: string[] }

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json(
        { error: 'At least one writing sample is required' },
        { status: 400 }
      )
    }

    // Filter out empty samples
    const validSamples = samples.filter((s) => s.trim().length > 50)
    if (validSamples.length === 0) {
      return NextResponse.json(
        { error: 'Samples must contain at least 50 characters each' },
        { status: 400 }
      )
    }

    // Single sample → analyze, multiple → aggregate
    const styleData = validSamples.length === 1
      ? await analyzeStyle(validSamples[0])
      : await aggregateStyle(validSamples)

    return NextResponse.json({ styleData })
  } catch (error) {
    console.error('Style analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze writing style' },
      { status: 500 }
    )
  }
}
