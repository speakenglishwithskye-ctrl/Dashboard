import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planLabel, platformLabel } from '@/lib/utils'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('sales')
    .select('*, agent:profiles!sales_agent_id_fkey(*)')
    .order('sale_date', { ascending: false })

  if (from) query = query.gte('sale_date', from)
  if (to)   query = query.lte('sale_date', to)

  const { data: sales } = await query

  const headers = ['Date', 'Agent', 'Buyer Email', 'Plan', 'Sale Type', 'Platform', 'Price', 'Repeat Buyer', 'Purchase #', 'Previous Plan', 'Notes']
  const rows = (sales || []).map(s => [
    s.sale_date,
    (s.agent as any)?.full_name || (s.agent as any)?.email || '',
    s.buyer_email,
    planLabel(s.premium_plan),
    s.sale_type,
    platformLabel(s.platform),
    s.price,
    s.is_repeat_buyer ? 'Yes' : 'No',
    s.purchase_count,
    s.previous_plan ? planLabel(s.previous_plan) : '',
    s.notes || '',
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="lifi-sales-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
