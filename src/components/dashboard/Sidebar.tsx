'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ShoppingCart, Users, UserCheck,
  PlusCircle, BookOpen, LogOut, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'

  const adminLinks = [
    { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/sales', label: 'All Sales', icon: ShoppingCart },
    { href: '/dashboard/buyers', label: 'Buyer Intelligence', icon: BookOpen },
    { href: '/dashboard/agents', label: 'Agents', icon: Users },
    { href: '/dashboard/my-sales', label: 'My Sales', icon: UserCheck },
    { href: '/dashboard/add-sale', label: 'Add Sale', icon: PlusCircle },
  ]

  const agentLinks = [
    { href: '/dashboard/overview', label: 'My Overview', icon: LayoutDashboard },
    { href: '/dashboard/my-sales', label: 'My Sales', icon: ShoppingCart },
    { href: '/dashboard/add-sale', label: 'Add Sale', icon: PlusCircle },
  ]

  const links = isAdmin ? adminLinks : agentLinks

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-100 h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">LF</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">LiFi</p>
            <p className="text-xs text-gray-400 leading-tight">Sales Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 group',
                active
                  ? 'bg-sky-50 text-sky-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-sky-500' : 'text-gray-400 group-hover:text-gray-600')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-sky-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <span className="text-sky-600 font-semibold text-xs">
              {profile.full_name?.charAt(0)?.toUpperCase() || profile.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
