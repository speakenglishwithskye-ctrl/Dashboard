import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/dashboard/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Try to get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile exists, create one automatically
  if (!profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email!,
      role: 'agent',
      full_name: user.user_metadata?.full_name || '',
    })

    // Fetch again after creating
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!newProfile) {
      // Still failed - show error
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center max-w-sm px-6">
            <p className="text-gray-700 font-medium mb-2">Profile setup failed</p>
            <p className="text-sm text-gray-400 mb-4">Please run this in Supabase SQL Editor:</p>
            <code className="text-xs bg-gray-100 p-3 rounded block text-left">
              UPDATE profiles SET role = &apos;admin&apos; WHERE email = &apos;{user.email}&apos;;
            </code>
          </div>
        </div>
      )
    }

    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar profile={newProfile} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto pb-20 lg:pb-0">
            {children}
          </main>
        </div>
        <MobileNav profile={newProfile} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav profile={profile} />
    </div>
  )
}
