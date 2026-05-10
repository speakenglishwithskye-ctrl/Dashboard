'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'

interface DateRangeFilterProps {
  value: string
  onChange: (range: string, from?: string, to?: string) => void
}

const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function handlePreset(preset: string) {
    if (preset === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      onChange(preset)
    }
  }

  function applyCustom() {
    if (from && to) {
      onChange('custom', from, to)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(preset => (
          <button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === preset.value
                ? 'bg-sky-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 mt-2 w-full">
          <input
            type="date"
            className="notion-input text-xs py-1.5 w-auto"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            className="notion-input text-xs py-1.5 w-auto"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
          <button onClick={applyCustom} className="btn-primary text-xs py-1.5">Apply</button>
        </div>
      )}
    </div>
  )
}
