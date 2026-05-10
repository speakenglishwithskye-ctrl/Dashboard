import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, role, full_name } = await request.json()

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Pre-create the profile record so role is ready when they log in
    await supabaseAdmin.from('profiles').upsert({
      email,
      role,
      full_name: full_name || '',
    }, { onConflict: 'email' })

    // Generate the invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.vercel.app'}/invite?email=${encodeURIComponent(email)}&role=${role}`

    return NextResponse.json({ success: true, inviteUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
