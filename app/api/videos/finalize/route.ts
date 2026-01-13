import { NextResponse } from 'next/server'

import { getMuxVideoClient } from '@/lib/mux/client'
import { createClient } from '@/lib/supabase/server'

interface PassthroughPayload {
  profileId: string
  title: string
  description: string
  generationSource: 'ai' | 'human'
  unlockAt: string
}

function parsePassthrough(value?: string | null): PassthroughPayload | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return {
      profileId: parsed.profileId,
      title: parsed.title,
      description: parsed.description,
      generationSource: parsed.generationSource === 'ai' ? 'ai' : 'human',
      unlockAt: parsed.unlockAt,
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { uploadId } = await req.json()

    if (!uploadId || typeof uploadId !== 'string') {
      return NextResponse.json({ error: 'uploadId is required' }, { status: 400 })
    }

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

    const muxVideo = getMuxVideoClient()
    const upload = await muxVideo.uploads.retrieve(uploadId)

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    if (upload.status === 'errored') {
      return NextResponse.json({ status: 'errored', error: upload.error?.message ?? 'Upload failed' }, { status: 400 })
    }

    const passthroughRaw = upload.new_asset_settings?.passthrough ?? null
    const passthrough = parsePassthrough(passthroughRaw)

    if (!passthrough || passthrough.profileId !== user.id) {
      return NextResponse.json({ error: 'Upload metadata missing or does not match user' }, { status: 403 })
    }

    if (!upload.asset_id) {
      return NextResponse.json({ status: upload.status ?? 'waiting' })
    }

    const asset = await muxVideo.assets.retrieve(upload.asset_id)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found yet' }, { status: 404 })
    }

    if (asset.status !== 'ready') {
      return NextResponse.json({ status: asset.status ?? 'processing' })
    }

    const playbackId =
      asset.playback_ids?.find((p: { id: string; policy?: string | null }) => p.policy === 'public')?.id ?? null

    const { data: existing } = await supabase
      .from('videos')
      .select('*')
      .eq('mux_asset_id', asset.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ status: 'ready', video: existing })
    }

    const { data, error } = await supabase
      .from('videos')
      .insert({
        profile_id: user.id,
        title: passthrough.title,
        description: passthrough.description,
        generation_source: passthrough.generationSource,
        mux_asset_id: asset.id,
        mux_playback_id: playbackId,
        unlock_at: passthrough.unlockAt ?? new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('Failed to insert video', error)
      return NextResponse.json({ error: 'Failed to save video' }, { status: 500 })
    }

    return NextResponse.json({ status: 'ready', video: data })
  } catch (error) {
    console.error('Failed to finalize MUX upload', error)
    return NextResponse.json({ error: 'Failed to finalize upload' }, { status: 500 })
  }
}


