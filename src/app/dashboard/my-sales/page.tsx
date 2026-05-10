'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import SalesTable from '@/components/dashboard/SalesTable'
import PageHeader from '@/components/ui/PageHeader'
import DateRangeFilter from '@/components/ui/DateRangeFilter'
import StatCard from '@/components/ui/StatCard'
import { getDateRangeFilter, formatCurrency } from '@/lib/utils'
import { DollarSign, ShoppingCart, Users, Repeat } from 'lucide-react'
import type { Sale } from '@/types'
import toast from 'react-hot-toast'

export default function MySalesPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [userId, setUserId] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
          setCanEdit(data?.role === 'admin' || true) // agents can edit within 24h
        })
      }
    })
  }, [supabase])

  const loadSales = useCallback(async (range: string, from?: string, to?: string) => {
    if (!userId) return
    setLoading(true)
    let f: string, t: string
    if (range === 'custom' && from && to) { f = from; t = to }
    else { const d = getDateRangeFilter(range); f = d.from; t = d.to }

    const { data } = await supabase
      .from('sales')
      .select('*')
      .eq('agent_id', userId)
      .gte('sale_date', f)
      .lte('sale_date', t)
      .order('sale_date', { ascending: false })

    setSales(data || [])
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    if (userId) loadSales(dateRange)
  }, [userId, dateRange, loadSales])

  async function handleDelete(id: string) {
    // Only admin can delete
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) { toast.error('Delete failed'); return }
    toast.success('Sale deleted')
    loadSales(dateRange)
  }

  const totalRevenue = sales.reduce((s, r) => s + (r.price || 0), 0)
  const uniqueBuyers = new Set(sales.map(s => s.buyer_email)).size
  const repeatBuyers = sales.filter(s => s.is_repeat_buyer).length

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="My Sales"
        subtitle={`${sales.length} records`}
        actions={
          <DateRangeFilter value={dateRange} onChange={(r, f, t) => { setDateRange(r); loadSales(r, f, t) }} />
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} iconColor="text-sky-500" />
        <StatCard title="My Sales" value={sales.length} icon={ShoppingCart} iconColor="text-sky-500" />
        <StatCard title="Unique Buyers" value={uniqueBuyers} icon={Users} iconColor="text-sky-500" />
        <StatCard title="Repeat Buyers" value={repeatBuyers} icon={Repeat} iconColor="text-blue-500" />
      </div>

      <div className="notion-card">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading your sales…</div>
        ) : (
          <SalesTable
            sales={sales}
            isAdmin={false}
          />
        )}
      </div>
    </div>
  )
}
