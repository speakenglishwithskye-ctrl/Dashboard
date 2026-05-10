'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to send code.')
      return
    }
    toast.success('6-digit code sent to your Gmail!')
    setStep('otp')
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    setLoading(false)
    if (error) {
      toast.error('Invalid or expired code. Try again.')
      return
    }
    window.location.href = '/dashboard/overview'
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 bg-sky-50 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LF</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">LiFi</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            Track every sale.<br /> Grow every day.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Your sales dashboard for LiFi — the AI companion language learning app.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-gray-400">
          <span>© 2025 LiFi</span>
          <span>Sales Dashboard</span>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-sky-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">LF</span>
            </div>
            <span className="font-semibold text-gray-900">LiFi Dashboard</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {step === 'email' ? 'Sign in' : 'Enter your code'}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {step === 'email'
              ? 'Enter your Gmail address to receive a 6-digit code.'
              : `We sent a 6-digit code to ${email}`}
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="notion-label">Gmail address</label>
                <input
                  type="email"
                  className="notion-input"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full justify-center py-2.5"
                disabled={loading}
              >
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
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full justify-center py-2.5"
                disabled={loading || otp.length < 6}
              >
                {loading ? 'Verifying…' : 'Sign in'}
              </button>
              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center py-1"
                onClick={() => {
                  setStep('email');
                  setOtp('')
                }}
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
