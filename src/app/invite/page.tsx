'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function InviteContent() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [step, setStep] = useState<'name' | 'otp'>('name')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(decodeURIComponent(emailParam))
  }, [searchParams])

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('6-digit code sent to your Gmail!')
    setStep('otp')
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) { toast.error('Invalid code.'); setLoading(false); return }
    // Update profile name
    await supabase.from('profiles').update({ full_name: fullName }).eq('email', email)
    window.location.href = '/dashboard/overview'
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-sky-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">LF</span>
          </div>
          <span className="font-semibold text-gray-900">LiFi Dashboard</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re invited!</h1>
        <p className="text-sm text-gray-500 mb-8">
          {step === 'name'
            ? 'Set your name and confirm your email to get started.'
            : `Enter the 6-digit code sent to ${email}`}
        </p>

        {step === 'name' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="notion-label">Your full name</label>
              <input
                className="notion-input"
                placeholder="Jane Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="notion-label">Gmail address</label>
              <input
                type="email"
                className="notion-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="notion-label">6-digit code</label>
              <input
                type="text"
                className="notion-input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying…' : 'Access Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-gray-400">Loading…</span></div>}>
      <InviteContent />
    </Suspense>
  )
}
