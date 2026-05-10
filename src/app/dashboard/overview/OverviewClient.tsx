'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/ui/StatCard'
import DateRangeFilter from '@/components/ui/DateRangeFilter'
import PageHeader from '@/components/ui/PageHeader'
import SalesTable from '@/components/dashboard/SalesTable'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { DollarSign, ShoppingCart, Users, Repeat, TrendingUp, Star } from 'lucide-react'
import { formatCurrency, getDateRangeFilter, planLabel, platformLabel } from '@/lib/utils'
import type { Profile, Sale } from '@/types'

const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe']

export default function OverviewClient({ profile, userId }: { profile: Profile; userId: string }) {
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'
  const [dateRange, setDateRange] = useState('30days')
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [agentMap, setAgentMap] = useState<Record<string, Profile>>({})

  const loadData = useCallback(async (range: string, customFrom?: string, customTo?: string) => {
    setLoading(true)
    let from: string, to: string
    if (range === 'custom' && customFrom && customTo) {
      from = customFrom; to = customTo
    } else {
      const d = getDateRangeFilter(range)
      from = d.from; to = d.to
    }

    let query = supabase.from('sales').select('*, agent:profiles!sales_agent_id_fkey(*)').gte('sale_date', from).lte('sale_date', to).order('sale_date', { ascending: false })
    if (!isAdmin) query = query.eq('agent_id', userId)

    const { data } = await query
    setSales(data || [])

    if (isAdmin) {
      const { data: agents } = await supabase.from('profiles').select('*')
      const map: Record<string, Profile> = {}
      agents?.forEach(a => { map[a.id] = a })
      setAgentMap(map)
    }

    setLoading(false)
  }, [supabase, isAdmin, userId])

  useEffect(() => { loadData(dateRange) }, [dateRange, loadData])

  // Calculate stats
  const totalRevenue = sales.reduce((s, r) => s + (r.price || 0), 0)
  const totalSales = sales.length
  const uniqueBuyers = new Set(sales.map(s => s.buyer_email)).size
  const repeatBuyers = sales.filter(s => s.is_repeat_buyer).length
  const repeatPct = totalSales > 0 ? Math.round((repeatBuyers / totalSales) * 100) : 0

  // Agent revenue chart
  const agentRevenue = Object.values(
    sales.reduce((acc: Record<string, { name: string; revenue: number }>, sale) => {
      const id = sale.agent_id
      const name = agentMap[id]?.full_name || agentMap[id]?.email || 'Unknown'
      if (!acc[id]) acc[id] = { name, revenue: 0 }
      acc[id].revenue += sale.price || 0
      return acc
    }, {})
  ).sort((a, b) => b.revenue - a.revenue)

  // Plan distribution
  const planDist = Object.entries(
    sales.reduce((acc: Record<string, number>, s) => {
      acc[s.premium_plan] = (acc[s.premium_plan] || 0) + 1
      return acc
    }, {})
  ).map(([plan, count]) => ({ name: planLabel(plan), value: count }))

  // New vs repeat pie
  const newVsRepeat = [
    { name: 'New Buyers', value: totalSales - repeatBuyers },
    { name: 'Repeat Buyers', value: repeatBuyers },
  ]

  // Top agent
  const topAgent = agentRevenue[0]

  // Recent 10 sales
  const recentSales = sales.slice(0, 10)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title={isAdmin ? 'Overview' : 'My Overview'}
        subtitle={`Welcome back, ${profile.full_name || 'User'}`}
        actions={
          <DateRangeFilter
            value={dateRange}
            onChange={(range, from, to) => { setDateRange(range); loadData(range, from, to) }}
          />
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="notion-card animate-pulse h-24 bg-gray-50" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
              icon={DollarSign}
              iconColor="text-sky-500"
            />
            <StatCard
              title="Total Sales"
              value={totalSales}
              icon={ShoppingCart}
              iconColor="text-sky-500"
            />
            <StatCard
              title="Unique Buyers"
              value={uniqueBuyers}
              icon={Users}
              iconColor="text-sky-500"
            />
            <StatCard
              title="Repeat Buyers"
              value={repeatBuyers}
              subtitle={`${repeatPct}% of all sales`}
              icon={Repeat}
              iconColor="text-blue-500"
            />
            {isAdmin && topAgent && (
              <StatCard
                title="Top Agent"
                value={topAgent.name}
                subtitle={formatCurrency(topAgent.revenue) + ' revenue'}
                icon={Star}
                iconColor="text-amber-500"
                className="col-span-2 lg:col-span-2"
              />
            )}
          </div>

          {/* Charts */}
          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Revenue by Agent */}
              <div className="notion-card">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Agent</h3>
                {agentRevenue.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={agentRevenue} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* New vs Repeat */}
              <div className="notion-card">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">New vs Repeat Buyers</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={newVsRepeat} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {newVsRepeat.map((_, i) => <Cell key={i} fill={i === 0 ? '#22c55e' : '#0ea5e9'} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Plan Distribution */}
              <div className="notion-card lg:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Plan Distribution</h3>
                {planDist.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={planDist} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Recent Sales */}
          <div className="notion-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Sales</h3>
            <SalesTable sales={recentSales} isAdmin={isAdmin} />
          </div>
        </>
      )}
    </div>
  )
}
