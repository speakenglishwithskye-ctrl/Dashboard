'use client'

import { useState } from 'react'
import { formatDate, planLabel, platformLabel, cn } from '@/lib/utils'
import ScreenshotModal from '@/components/ui/ScreenshotModal'
import type { Sale } from '@/types'
import Image from 'next/image'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface SalesTableProps {
  sales: Sale[]
  isAdmin?: boolean
  onDelete?: (id: string) => void
  onEdit?: (sale: Sale) => void
}

export default function SalesTable({ sales, isAdmin, onDelete, onEdit }: SalesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (sales.length === 0) {
    return <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">No sales records found</div>
  }

  return (
    <>
      {screenshotUrl && <ScreenshotModal url={screenshotUrl} onClose={() => setScreenshotUrl(null)} />}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-modal">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delete Sale?</h3>
            <p className="text-sm text-gray-500 mb-5">This will permanently delete this sale record and update buyer history.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => { onDelete?.(confirmDeleteId); setConfirmDeleteId(null) }}
                className="btn-danger flex-1 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['Date', isAdmin && 'Agent', 'Buyer', 'Plan', 'Type', 'Platform', 'Price', 'Status', 'Screenshot', isAdmin && 'Actions'].filter(Boolean).map(h => (
                <th key={h as string} className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {sales.map(sale => (
              <>
                <tr key={sale.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                      {(sale.agent as any)?.full_name || (sale.agent as any)?.email || '—'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300 max-w-[140px] truncate">{sale.buyer_email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium">{planLabel(sale.premium_plan)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium',
                      sale.sale_type === 'real_sale' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                      {sale.sale_type === 'real_sale' ? '💰 Sale' : '🎁 Giveaway'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{platformLabel(sale.platform)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {sale.price.toLocaleString()} MMK
                  </td>
                  <td className="py-3 px-4">
                    {sale.is_repeat_buyer
                      ? <span className="badge-repeat">↩ Repeat</span>
                      : <span className="badge-new">✦ New</span>}
                  </td>
                  <td className="py-3 px-4">
                    {sale.screenshot_url ? (
                      <button onClick={e => { e.stopPropagation(); setScreenshotUrl(sale.screenshot_url!) }}
                        className="w-10 h-8 rounded-md overflow-hidden border border-gray-200 hover:border-sky-300 transition-colors">
                        <Image src={sale.screenshot_url} alt="screenshot" width={40} height={32}
                          className="w-full h-full object-cover" unoptimized />
                      </button>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <button onClick={() => onEdit(sale)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Edit sale">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => setConfirmDeleteId(sale.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete sale">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedId === sale.id && (
                  <tr key={`${sale.id}-exp`} className="bg-gray-50/60 dark:bg-gray-800/30">
                    <td colSpan={isAdmin ? 10 : 9} className="px-4 py-3">
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Purchase #{sale.purchase_count}</span>
                        {sale.previous_plan && <span>Previous plan: <b>{planLabel(sale.previous_plan)}</b></span>}
                        {sale.notes && <span>Notes: {sale.notes}</span>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 p-4">
        {sales.map(sale => (
          <div key={sale.id} className="notion-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{sale.buyer_email}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.sale_date)}</p>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{sale.price.toLocaleString()} MMK</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium">{planLabel(sale.premium_plan)}</span>
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">{platformLabel(sale.platform)}</span>
              {sale.is_repeat_buyer ? <span className="badge-repeat">↩ Repeat</span> : <span className="badge-new">✦ New</span>}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                {onEdit && (
                  <button onClick={() => onEdit(sale)} className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => setConfirmDeleteId(sale.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
