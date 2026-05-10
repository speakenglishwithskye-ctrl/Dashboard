'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { formatCurrency, formatDate } from '@/lib/utils'
import { UserPlus, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types'

interface AgentStats extends Profile {
  total_sales: number
  total_revenue: number
  new_buyers: number
  repeat_buyers: number
}

export default function AgentsPage() {
  const supabase = createClient()
  const [agents, setAgents] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'agent' | 'admin'>('agent')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at')
    const { data: sales } = await supabase.from('sales').select('agent_id, price, is_repeat_buyer')

    const statsMap: Record<string, AgentStats> = {}
    profiles?.forEach(p => {
      statsMap[p.id] = { ...p, total_sales: 0, total_revenue: 0, new_buyers: 0, repeat_buyers: 0 }
    })
    sales?.forEach(s => {
      if (statsMap[s.agent_id]) {
        statsMap[s.agent_id].total_sales++
        statsMap[s.agent_id].total_revenue += s.price || 0
        if (s.is_repeat_buyer) statsMap[s.agent_id].repeat_buyers++
        else statsMap[s.agent_id].new_buyers++
      }
    })

    setAgents(Object.values(statsMap))
    setLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)

    // Create profile record for the invited user
    const { error } = await supabase.from('profiles').insert({
      email: inviteEmail,
      role: inviteRole,
      full_name: inviteName,
    })

    if (error && !error.message.includes('duplicate')) {
      toast.error('Failed to prepare invite: ' + error.message)
      setInviting(false)
      return
    }

    // Generate invite link
    const inviteUrl = `${window.location.origin}/invite?email=${encodeURIComponent(inviteEmail)}&role=${inviteRole}`

    // In production, you'd use Supabase Admin API to send actual invite email
    // For now, copy the invite link
    await navigator.clipboard.writeText(inviteUrl).catch(() => {})
    toast.success(`Invite link copied! Send to ${inviteEmail}`)
    setShowInvite(false)
    setInviteEmail('')
    setInviteName('')
    setInviting(false)
    loadAgents()
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Team"
        subtitle="Manage admins and sales agents"
        actions={
          <button onClick={() => setShowInvite(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        }
      />

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-modal">
            <h3 className="font-semibold text-gray-900 mb-4">Invite New Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="notion-label">Full Name</label>
                <input className="notion-input" placeholder="Jane Smith" value={inviteName} onChange={e => setInviteName(e.target.value)} required />
              </div>
              <div>
                <label className="notion-label">Gmail Address</label>
                <input type="email" className="notion-input" placeholder="agent@gmail.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              </div>
              <div>
                <label className="notion-label">Role</label>
                <div className="flex gap-3">
                  {(['agent', 'admin'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setInviteRole(r)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all capitalize ${inviteRole === r ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={inviting}>
                  <Mail className="w-4 h-4" />
                  {inviting ? 'Generating…' : 'Copy Invite Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading team…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="notion-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-sky-600 font-semibold">
                    {agent.full_name?.charAt(0)?.toUpperCase() || agent.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{agent.full_name || '—'}</p>
                  <p className="text-xs text-gray-400">{agent.email}</p>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium capitalize ${agent.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                  {agent.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Revenue</p>
                  <p className="font-bold text-gray-900">{formatCurrency(agent.total_revenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Total Sales</p>
                  <p className="font-bold text-gray-900">{agent.total_sales}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-500 mb-1">New Buyers</p>
                  <p className="font-bold text-green-700">{agent.new_buyers}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-500 mb-1">Repeat Buyers</p>
                  <p className="font-bold text-blue-700">{agent.repeat_buyers}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-3">Joined {formatDate(agent.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
