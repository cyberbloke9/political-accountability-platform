import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    // After successful session creation, ensure user exists in users table
    if (session?.user && !sessionError) {
      const user = session.user

      // Check if user already exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle()

      // Create user if they don't exist
      if (!existingUser) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user'

        await supabase
          .from('users')
          .insert({
            auth_id: user.id,
            email: user.email,
            username: username,
            citizen_score: 0
          })
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
