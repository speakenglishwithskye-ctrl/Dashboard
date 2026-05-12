'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Upload, X, CheckCircle, RefreshCw } from 'lucide-react'
import { planLabel, platformLabel, formatDate } from '@/lib/utils'
import type { BuyerHistory, PremiumPlan } from '@/types'
import Image from 'next/image'

interface AddSaleFormProps {
  agentId: string
}

const PLANS: PremiumPlan[] = ['weekly', 'monthly', 'three_months', 'six_months', 'yearly']
const PLATFORMS = ['telegram', 'facebook', 'tiktok']

export default function AddSaleForm({ agentId }: AddSaleFormProps) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    buyer_email: '',
    premium_plan: '' as PremiumPlan | '',
    sale_date: today,
    sale_type: 'real_sale',
    platform: '',
    price: '',
    notes: '',
  })
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [buyerInfo, setBuyerInfo] = useState<BuyerHistory | null>(null)
  const [buyerLoading, setBuyerLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setScreenshot(file)
      setScreenshotPreview(URL.createObjectURL(file))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  async function checkBuyer(email: string) {
    if (!email || !email.includes('@')) { setBuyerInfo(null); return }
    setBuyerLoading(true)
    const { data } = await supabase
      .from('buyer_history')
      .select('*')
      .eq('buyer_email', email)
      .single()
    setBuyerInfo(data)
    setBuyerLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.premium_plan || !form.platform) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)

    let screenshot_url = null
    if (screenshot) {
      const ext = screenshot.name.split('.').pop()
      const path = `${agentId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('sale-screenshots')
        .upload(path, screenshot, { contentType: screenshot.type })
      if (uploadError) {
        toast.error('Screenshot upload failed')
        setSubmitting(false)
        return
      }
      const { data: urlData } = supabase.storage.from('sale-screenshots').getPublicUrl(path)
      screenshot_url = urlData.publicUrl
    }

    const { error } = await supabase.from('sales').insert({
      agent_id: agentId,
      buyer_email: form.buyer_email,
      premium_plan: form.premium_plan,
      sale_date: form.sale_date,
      sale_type: form.sale_type,
      platform: form.platform,
      price: parseFloat(form.price),
      notes: form.notes || null,
      screenshot_url,
    })

    setSubmitting(false)
    if (error) { toast.error('Failed to save sale: ' + error.message); return }

    toast.success('Sale recorded successfully!')
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setForm({ buyer_email: '', premium_plan: '', sale_date: today, sale_type: 'real_sale', platform: '', price: '', notes: '' })
      setScreenshot(null)
      setScreenshotPreview(null)
      setBuyerInfo(null)
    }, 2500)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Sale Recorded!</h3>
        <p className="text-sm text-gray-500">The form will reset shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
      {/* Buyer Email */}
      <div>
        <label className="notion-label">Buyer Gmail <span className="text-red-400">*</span></label>
        <input
          type="email"
          className="notion-input"
          placeholder="buyer@gmail.com"
          value={form.buyer_email}
          onChange={e => {
            setForm(f => ({ ...f, buyer_email: e.target.value }))
            checkBuyer(e.target.value)
          }}
          required
        />
        {/* Buyer status */}
        {buyerLoading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <RefreshCw className="w-3 h-3 animate-spin" /> Checking buyer history…
          </div>
        )}
        {!buyerLoading && form.buyer_email.includes('@') && buyerInfo === null && (
          <div className="mt-2 flex items-center gap-2">
            <span className="badge-new">✦ New Buyer</span>
            <span className="text-xs text-gray-400">First time purchase</span>
          </div>
        )}
        {!buyerLoading && buyerInfo && (
          <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-repeat">↩ Repeat Buyer</span>
              <span className="text-xs text-blue-600 font-medium">{buyerInfo.total_purchases} previous purchase{buyerInfo.total_purchases !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
              <span className="text-blue-400">Last plan:</span>
              <span className="font-medium">{planLabel(buyerInfo.plans_purchased?.slice(-1)[0] || '')}</span>
              <span className="text-blue-400">Last purchase:</span>
              <span className="font-medium">{formatDate(buyerInfo.last_purchase_date)}</span>
              <span className="text-blue-400">Total spent:</span>
              <span className="font-medium">${buyerInfo.total_spent?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Premium Plan */}
      <div>
        <label className="notion-label">Premium Plan <span className="text-red-400">*</span></label>
        <select
          className="notion-select"
          value={form.premium_plan}
          onChange={e => setForm(f => ({ ...f, premium_plan: e.target.value as PremiumPlan }))}
          required
        >
          <option value="">Select a plan…</option>
          {PLANS.map(p => (
            <option key={p} value={p}>{planLabel(p)}</option>
          ))}
        </select>
      </div>

      {/* Sale Date */}
      <div>
        <label className="notion-label">Sale Date <span className="text-red-400">*</span></label>
        <input
          type="date"
          className="notion-input"
          value={form.sale_date}
          onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))}
          required
        />
        <p className="text-xs text-gray-400 mt-1">You can set past dates for historical records</p>
      </div>

      {/* Sale Type */}
      <div>
        <label className="notion-label">Sale Type <span className="text-red-400">*</span></label>
        <div className="flex gap-3">
          {['real_sale', 'giveaway'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setForm(f => ({ ...f, sale_type: type }))}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                form.sale_type === type
                  ? 'border-sky-400 bg-sky-50 text-sky-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type === 'real_sale' ? '💰 Real Sale' : '🎁 Giveaway'}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="notion-label">Price (MMK) <span className="text-red-400">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MMK</span>
          <input
            type="number"
            className="notion-input pl-7"
            placeholder="0"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      {/* Platform */}
      <div>
        <label className="notion-label">Platform <span className="text-red-400">*</span></label>
        <div className="flex gap-3">
          {PLATFORMS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setForm(f => ({ ...f, platform: p }))}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                form.platform === p
                  ? 'border-sky-400 bg-sky-50 text-sky-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {platformLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot Upload */}
      <div>
        <label className="notion-label">Screenshot</label>
        {screenshotPreview ? (
          <div className="relative inline-block">
            <Image
              src={screenshotPreview}
              alt="Preview"
              width={200}
              height={150}
              className="rounded-lg border border-gray-200 object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => { setScreenshot(null); setScreenshotPreview(null) }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-sky-400 bg-sky-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="notion-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          className="notion-input resize-none"
          rows={3}
          placeholder="Any additional notes about this sale…"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <button type="submit" className="btn-primary w-full justify-center py-3 text-base" disabled={submitting}>
        {submitting ? 'Saving…' : 'Record Sale'}
      </button>
    </form>
  )
}
