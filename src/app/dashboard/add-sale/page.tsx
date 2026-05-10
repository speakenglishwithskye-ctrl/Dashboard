import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddSaleForm from '@/components/forms/AddSaleForm'
import PageHeader from '@/components/ui/PageHeader'

export default async function AddSalePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <PageHeader
        title="Add New Sale"
        subtitle="Record a new sale transaction"
      />
      <div className="notion-card">
        <AddSaleForm agentId={user.id} />
      </div>
    </div>
  )
}
