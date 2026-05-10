'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, PlusCircle, Users, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

export default function MobileNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'

  const adminLinks = [
    { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/sales', label: 'Sales', icon: ShoppingCart },
    { href: '/dashboard/add-sale', label: 'Add', icon: PlusCircle },
    { href: '/dashboard/buyers', label: 'Buyers', icon: BookOpen },
    { href: '/dashboard/agents', label: 'Agents', icon: Users },
  ]

  const agentLinks = [
    { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/my-sales', label: 'My Sales', icon: ShoppingCart },
    { href: '/dashboard/add-sale', label: 'Add', icon: PlusCircle },
  ]

  const links = isAdmin ? adminLinks : agentLinks

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-50">
      <div className="flex justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          const isAdd = href.includes('add-sale')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all',
                isAdd
                  ? 'bg-sky-500 text-white px-4'
                  : active
                    ? 'text-sky-600'
                    : 'text-gray-400'
              )}
            >
              <Icon className={cn('w-5 h-5', isAdd && 'text-white')} />
              <span className={cn('text-[10px] font-medium', isAdd && 'text-white')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
