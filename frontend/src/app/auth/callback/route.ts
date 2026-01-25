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

      // Use RPC to link/create user (bypasses RLS issues)
      await supabase.rpc('link_user_auth_id', {
        p_auth_id: user.id,
        p_email: user.email
      })
    }
  }

  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
