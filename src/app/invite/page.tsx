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
    if (emailParam) {
      const decoded = decodeURIComponent(emailParam)
      setEmail(decoded)
      // Load their name and role from pending_invites
      supabase.from('pending_invites').select('full_name').eq('email', decoded).single()
        .then(({ data }) => { if (data?.full_name) setFullName(data.full_name) })
    }
  }, [searchParams, supabase])

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Code sent to your Gmail!')
    setStep('otp')
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: authData, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'email'
    })
    if (error) { toast.error('Invalid code.'); setLoading(false); return }

    // After login, apply role from pending_invites to their profile
    if (authData.user) {
      const { data: invite } = await supabase
        .from('pending_invites')
        .select('role, full_name')
        .eq('email', email)
        .single()

      if (invite) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          role: invite.role,
          full_name: fullName || invite.full_name,
        }, { onConflict: 'id' })

        // Clean up invite
        await supabase.from('pending_invites').delete().eq('email', email)
      }
    }

    setLoading(false)
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
            ? 'Confirm your name and email to get started.'
            : `Enter the code sent to ${email}`}
        </p>

        {step === 'name' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="notion-label">Your full name</label>
              <input className="notion-input" placeholder="Jane Smith"
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="notion-label">Gmail address</label>
              <input type="email" className="notion-input"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Sending…' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="notion-label">Login code (6-8 digits)</label>
              <input
                type="text"
                className="notion-input text-center text-2xl tracking-[0.4em] font-mono"
                placeholder="00000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5"
              disabled={loading || otp.length < 6}>
              {loading ? 'Verifying…' : 'Access Dashboard'}
            </button>
            <button type="button"
              className="w-full text-sm text-gray-500 hover:text-gray-700 text-center py-1"
              onClick={() => { setStep('name'); setOtp('') }}>
              ← Back
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
