import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { authDestination } from '@/lib/auth-destination'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=callback&next=${encodeURIComponent(authDestination(requestUrl.searchParams.get('next')))}`)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
          },
          { onConflict: 'id' }
        )

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=callback`)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${authDestination(requestUrl.searchParams.get('next'))}`)
}
