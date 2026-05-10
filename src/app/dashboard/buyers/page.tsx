'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { formatDate, formatCurrency, planLabel, platformLabel } from '@/lib/utils'
import type { BuyerHistory } from '@/types'
import { ChevronDown, ChevronUp, Star, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react'

export default function BuyersPage() {
  const supabase = createClient()
  const [buyers, setBuyers] = useState<BuyerHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [salesByBuyer, setSalesByBuyer] = useState<Record<string, any[]>>({})
  const [filter, setFilter] = useState('')
  const [highValueThreshold, setHighValueThreshold] = useState(500)

  useEffect(() => {
    supabase.from('buyer_history').select('*').order('total_purchases', { ascending: false }).then(({ data }) => {
      setBuyers(data || [])
      setLoading(false)
    })
  }, [supabase])

  async function loadBuyerSales(email: string) {
    if (salesByBuyer[email]) return
    const { data } = await supabase
      .from('sales')
      .select('*, agent:profiles!sales_agent_id_fkey(*)')
      .eq('buyer_email', email)
      .order('sale_date', { ascending: true })
    setSalesByBuyer(prev => ({ ...prev, [email]: data || [] }))
  }

  function getPlanChangeIcon(prev: string, next: string) {
    const order = ['weekly', 'monthly', 'three_months', 'six_months', 'yearly']
    const pi = order.indexOf(prev), ni = order.indexOf(next)
    if (ni > pi) return <ArrowUp className="w-3 h-3 text-green-500" />
    if (ni < pi) return <ArrowDown className="w-3 h-3 text-red-500" />
    return <ArrowRight className="w-3 h-3 text-gray-400" />
  }

  const filtered = buyers.filter(b => {
    if (filter === 'repeat') return b.total_purchases > 1
    if (filter === 'high_value') return b.total_spent >= highValueThreshold
    return true
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Buyer Intelligence"
        subtitle={`${buyers.length} total buyers`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select className="notion-select text-sm w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Buyers</option>
          <option value="repeat">Repeat Buyers Only</option>
          <option value="high_value">High Value Buyers</option>
        </select>
        {filter === 'high_value' && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Threshold:</span>
            <span className="text-gray-400">$</span>
            <input
              type="number"
              className="notion-input w-24 text-sm py-1.5"
              value={highValueThreshold}
              onChange={e => setHighValueThreshold(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading buyers…</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(buyer => (
            <div key={buyer.buyer_email} className="notion-card">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  if (expandedEmail === buyer.buyer_email) {
                    setExpandedEmail(null)
                  } else {
                    setExpandedEmail(buyer.buyer_email)
                    loadBuyerSales(buyer.buyer_email)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <span className="text-sky-600 font-semibold text-xs">
                      {buyer.buyer_email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{buyer.buyer_email}</p>
                      {buyer.total_spent >= highValueThreshold && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      )}
                      {buyer.total_purchases > 1 && (
                        <span className="badge-repeat">↩ Repeat</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="text-xs text-gray-400">{buyer.total_purchases} purchase{buyer.total_purchases !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-gray-400">Total: {formatCurrency(buyer.total_spent)}</span>
                      <span className="text-xs text-gray-400">First: {formatDate(buyer.first_purchase_date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end max-w-[200px]">
                    {buyer.plans_purchased?.map((plan, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-xs font-medium">{planLabel(plan)}</span>
                    ))}
                  </div>
                  {expandedEmail === buyer.buyer_email
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>

              {/* Expanded Timeline */}
              {expandedEmail === buyer.buyer_email && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(buyer.total_spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Purchases</p>
                      <p className="font-semibold text-gray-900">{buyer.total_purchases}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Platforms</p>
                      <p className="font-semibold text-gray-900">{buyer.platforms_used?.map(platformLabel).join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Last Purchase</p>
                      <p className="font-semibold text-gray-900">{formatDate(buyer.last_purchase_date)}</p>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Purchase Timeline</h4>
                  {salesByBuyer[buyer.buyer_email] ? (
                    <div className="space-y-2">
                      {salesByBuyer[buyer.buyer_email].map((sale, idx) => (
                        <div key={sale.id} className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="text-xs text-gray-400">{idx + 1}</span>
                          </div>
                          <span className="text-gray-400 w-24 shrink-0">{formatDate(sale.sale_date)}</span>
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-xs font-medium">{planLabel(sale.premium_plan)}</span>
                          {idx > 0 && sale.previous_plan && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              {getPlanChangeIcon(sale.previous_plan, sale.premium_plan)}
                              from {planLabel(sale.previous_plan)}
                            </span>
                          )}
                          <span className="text-gray-600 font-medium ml-auto">${sale.price}</span>
                          <span className="text-gray-400 text-xs">{(sale.agent as any)?.full_name || (sale.agent as any)?.email || '—'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Loading timeline…</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">No buyers found</div>
          )}
        </div>
      )}
    </div>
  )
}
