import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planLabel, platformLabel } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: buyers } = await supabase
    .from('buyer_history')
    .select('*')
    .order('total_spent', { ascending: false })

  const headers = ['Buyer Email', 'Total Purchases', 'Total Spent', 'First Purchase', 'Last Purchase', 'Plans Purchased', 'Platforms Used']
  const rows = (buyers || []).map(b => [
    b.buyer_email,
    b.total_purchases,
    b.total_spent,
    b.first_purchase_date,
    b.last_purchase_date,
    (b.plans_purchased || []).map(planLabel).join(', '),
    (b.platforms_used || []).map(platformLabel).join(', '),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="lifi-buyers-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
