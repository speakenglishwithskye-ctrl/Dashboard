'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { planLabel, platformLabel } from '@/lib/utils'
import type { Sale, PremiumPlan } from '@/types'

interface EditSaleModalProps {
  sale: Sale
  onClose: () => void
  onSaved: () => void
}

const PLANS: PremiumPlan[] = ['weekly', 'monthly', 'three_months', 'six_months', 'yearly']
const PLATFORMS = ['telegram', 'facebook', 'tiktok']

export default function EditSaleModal({ sale, onClose, onSaved }: EditSaleModalProps) {
  const supabase = createClient()
  const [form, setForm] = useState({
    buyer_email: sale.buyer_email,
    premium_plan: sale.premium_plan,
    sale_date: sale.sale_date,
    sale_type: sale.sale_type,
    platform: sale.platform,
    price: String(sale.price),
    notes: sale.notes || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('sales')
      .update({
        buyer_email: form.buyer_email,
        premium_plan: form.premium_plan,
        sale_date: form.sale_date,
        sale_type: form.sale_type,
        platform: form.platform,
        price: parseFloat(form.price),
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sale.id)

    setSaving(false)
    if (error) { toast.error('Save failed: ' + error.message); return }
    toast.success('Sale updated!')
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-modal max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Edit Sale</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="notion-label">Buyer Gmail</label>
            <input type="email" className="notion-input" value={form.buyer_email}
              onChange={e => setForm(f => ({ ...f, buyer_email: e.target.value }))} required />
          </div>
          <div>
            <label className="notion-label">Premium Plan</label>
            <select className="notion-select" value={form.premium_plan}
              onChange={e => setForm(f => ({ ...f, premium_plan: e.target.value as PremiumPlan }))}>
              {PLANS.map(p => <option key={p} value={p}>{planLabel(p)}</option>)}
            </select>
          </div>
          <div>
            <label className="notion-label">Sale Date</label>
            <input type="date" className="notion-input" value={form.sale_date}
              onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))} required />
          </div>
          <div>
            <label className="notion-label">Sale Type</label>
            <div className="flex gap-3">
              {['real_sale', 'giveaway'].map(type => (
                <button key={type} type="button"
                  onClick={() => setForm(f => ({ ...f, sale_type: type }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${form.sale_type === type ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {type === 'real_sale' ? '💰 Real Sale' : '🎁 Giveaway'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="notion-label">Price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" className="notion-input pl-7" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0" step="0.01" />
            </div>
          </div>
          <div>
            <label className="notion-label">Platform</label>
            <div className="flex gap-3">
              {PLATFORMS.map(p => (
                <button key={p} type="button"
                  onClick={() => setForm(f => ({ ...f, platform: p }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${form.platform === p ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {platformLabel(p)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="notion-label">Notes</label>
            <textarea className="notion-input resize-none" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
