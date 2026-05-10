'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDateRangeFilter } from '@/lib/utils'
import type { Sale } from '@/types'

interface UseSalesOptions {
  agentId?: string       // if provided, filter to this agent only
  dateRange?: string
  customFrom?: string
  customTo?: string
}

export function useSales({ agentId, dateRange = '30days', customFrom, customTo }: UseSalesOptions = {}) {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    let from: string, to: string
    if (dateRange === 'custom' && customFrom && customTo) {
      from = customFrom; to = customTo
    } else {
      const d = getDateRangeFilter(dateRange)
      from = d.from; to = d.to
    }

    let q = supabase
      .from('sales')
      .select('*, agent:profiles!sales_agent_id_fkey(*)')
      .gte('sale_date', from)
      .lte('sale_date', to)
      .order('sale_date', { ascending: false })

    if (agentId) q = q.eq('agent_id', agentId)

    const { data } = await q
    setSales(data || [])
    setLoading(false)
  }, [supabase, agentId, dateRange, customFrom, customTo])

  useEffect(() => { refresh() }, [refresh])

  return { sales, loading, refresh }
}
