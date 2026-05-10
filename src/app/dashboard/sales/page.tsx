'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import SalesTable from '@/components/dashboard/SalesTable'
import PageHeader from '@/components/ui/PageHeader'
import DateRangeFilter from '@/components/ui/DateRangeFilter'
import { getDateRangeFilter, planLabel, platformLabel } from '@/lib/utils'
import { Download, Filter } from 'lucide-react'
import type { Sale, Profile } from '@/types'
import toast from 'react-hot-toast'

export default function SalesPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>([])
  const [agents, setAgents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [filters, setFilters] = useState({
    agent: '',
    platform: '',
    plan: '',
    sale_type: '',
    buyer_type: '',
  })
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: ags } = await supabase.from('profiles').select('*').eq('role', 'agent')
      setAgents(ags || [])
    })
  }, [supabase])

  const loadSales = useCallback(async (range: string, from?: string, to?: string) => {
    setLoading(true)
    let f: string, t: string
    if (range === 'custom' && from && to) { f = from; t = to }
    else { const d = getDateRangeFilter(range); f = d.from; t = d.to }

    let q = supabase.from('sales')
      .select('*, agent:profiles!sales_agent_id_fkey(*)')
      .gte('sale_date', f).lte('sale_date', t)
      .order('sale_date', { ascending: false })

    if (filters.agent) q = q.eq('agent_id', filters.agent)
    if (filters.platform) q = q.eq('platform', filters.platform)
    if (filters.plan) q = q.eq('premium_plan', filters.plan)
    if (filters.sale_type) q = q.eq('sale_type', filters.sale_type)
    if (filters.buyer_type === 'new') q = q.eq('is_repeat_buyer', false)
    if (filters.buyer_type === 'repeat') q = q.eq('is_repeat_buyer', true)

    const { data } = await q
    setSales(data || [])
    setLoading(false)
  }, [supabase, filters])

  useEffect(() => { loadSales(dateRange) }, [dateRange, filters, loadSales])

  async function handleDelete(id: string) {
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) { toast.error('Delete failed'); return }
    toast.success('Sale deleted')
    loadSales(dateRange)
  }

  function exportCSV() {
    const headers = ['Date', 'Agent', 'Buyer Email', 'Plan', 'Type', 'Platform', 'Price', 'Repeat Buyer', 'Notes']
    const rows = sales.map(s => [
      s.sale_date,
      (s.agent as any)?.full_name || (s.agent as any)?.email || '',
      s.buyer_email,
      planLabel(s.premium_plan),
      s.sale_type,
      platformLabel(s.platform),
      s.price,
      s.is_repeat_buyer ? 'Yes' : 'No',
      s.notes || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'lifi-sales.csv'; a.click()
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="All Sales"
        subtitle={`${sales.length} records`}
        actions={
          <button onClick={exportCSV} className="btn-secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="notion-card mb-6 space-y-4">
        <DateRangeFilter value={dateRange} onChange={(r, f, t) => { setDateRange(r); loadSales(r, f, t) }} />
        <div className="flex flex-wrap gap-3 pt-1">
          {isAdmin && (
            <select
              className="notion-select text-xs w-auto py-1.5"
              value={filters.agent}
              onChange={e => setFilters(f => ({ ...f, agent: e.target.value }))}
            >
              <option value="">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}
            </select>
          )}
          <select className="notion-select text-xs w-auto py-1.5" value={filters.platform} onChange={e => setFilters(f => ({ ...f, platform: e.target.value }))}>
            <option value="">All Platforms</option>
            <option value="telegram">Telegram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
          </select>
          <select className="notion-select text-xs w-auto py-1.5" value={filters.plan} onChange={e => setFilters(f => ({ ...f, plan: e.target.value }))}>
            <option value="">All Plans</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="three_months">3 Months</option>
            <option value="six_months">6 Months</option>
            <option value="yearly">Yearly</option>
          </select>
          <select className="notion-select text-xs w-auto py-1.5" value={filters.sale_type} onChange={e => setFilters(f => ({ ...f, sale_type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="real_sale">Real Sale</option>
            <option value="giveaway">Giveaway</option>
          </select>
          <select className="notion-select text-xs w-auto py-1.5" value={filters.buyer_type} onChange={e => setFilters(f => ({ ...f, buyer_type: e.target.value }))}>
            <option value="">All Buyers</option>
            <option value="new">New Buyers</option>
            <option value="repeat">Repeat Buyers</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="notion-card">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading sales…</div>
        ) : (
          <SalesTable
            sales={sales}
            isAdmin={isAdmin}
            onDelete={isAdmin ? handleDelete : undefined}
          />
        )}
      </div>
    </div>
  )
}
