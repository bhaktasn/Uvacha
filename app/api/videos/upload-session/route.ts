import { NextResponse } from 'next/server'

import { getMuxVideoClient } from '@/lib/mux/client'
import { createClient } from '@/lib/supabase/server'

const TITLE_MIN = 3
const TITLE_MAX = 120
const DESCRIPTION_MAX = 5000
const PROMPT_MAX = 10000
const GENERATION_SOURCES = new Set(['ai', 'human'])
const DUPLICATE_COMPETITION_DAY_ERROR = 'You already have a video competing on this date. Choose a different competition day.'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Supabase auth error', authError)
      return NextResponse.json({ error: 'Failed to authenticate request' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const title: string = (body?.title ?? '').trim()
    const description: string = (body?.description ?? '').trim()
    const prompt: string | null = body?.prompt ? String(body.prompt).trim() : null
    const rawGenerationSource: string = (body?.generationSource ?? 'ai').toLowerCase()
    const unlockAtInput: string | undefined = body?.unlockAt

    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters.` },
        { status: 400 }
      )
    }

    if (!description || description.length > DESCRIPTION_MAX) {
      return NextResponse.json(
        { error: `Description is required and must be under ${DESCRIPTION_MAX} characters.` },
        { status: 400 }
      )
    }

    if (!GENERATION_SOURCES.has(rawGenerationSource)) {
      return NextResponse.json({ error: 'generationSource must be either "ai" or "human".' }, { status: 400 })
    }

    if (prompt && prompt.length > PROMPT_MAX) {
      return NextResponse.json(
        { error: `Prompt must be under ${PROMPT_MAX} characters.` },
        { status: 400 }
      )
    }

    const unlockDate = unlockAtInput ? new Date(unlockAtInput) : new Date()

    if (Number.isNaN(unlockDate.getTime())) {
      return NextResponse.json({ error: 'unlockAt must be a valid datetime string.' }, { status: 400 })
    }

    const unlockAtIso = unlockDate.toISOString()
    const { data: existingVideoForDate, error: duplicateCheckError } = await supabase
      .from('videos')
      .select('id')
      .eq('profile_id', user.id)
      .eq('unlock_at', unlockAtIso)
      .limit(1)

    if (duplicateCheckError) {
      console.error('Failed to check duplicate competition day', duplicateCheckError)
      return NextResponse.json({ error: 'Failed to validate competition date' }, { status: 500 })
    }

    if (existingVideoForDate && existingVideoForDate.length > 0) {
      return NextResponse.json({ error: DUPLICATE_COMPETITION_DAY_ERROR }, { status: 409 })
    }

    const muxVideo = getMuxVideoClient()

    const corsOrigin = process.env.MUX_DIRECT_UPLOAD_CORS_ORIGIN || req.headers.get('origin') || '*'

    const passthroughPayload = {
      profileId: user.id,
      title,
      description,
      prompt,
      generationSource: rawGenerationSource,
      unlockAt: unlockAtIso,
    }

    const passthrough = JSON.stringify(passthroughPayload)

    const upload = await muxVideo.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        passthrough,
        playback_policy: ['public'],
      },
    })

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    })
  } catch (error) {
    console.error('Failed to create MUX upload session', error)
    return NextResponse.json({ error: 'Failed to create upload session' }, { status: 500 })
  }
}


