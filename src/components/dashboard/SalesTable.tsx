'use client'

import { useState } from 'react'
import { formatDate, planLabel, platformLabel, cn } from '@/lib/utils'
import ScreenshotModal from '@/components/ui/ScreenshotModal'
import type { Sale } from '@/types'
import Image from 'next/image'

interface SalesTableProps {
  sales: Sale[]
  isAdmin?: boolean
  onDelete?: (id: string) => void
  onEdit?: (sale: Sale) => void
}

export default function SalesTable({ sales, isAdmin, onDelete, onEdit }: SalesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  if (sales.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No sales records found</p>
      </div>
    )
  }

  return (
    <>
      {screenshotUrl && (
        <ScreenshotModal url={screenshotUrl} onClose={() => setScreenshotUrl(null)} />
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
              {isAdmin && <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Agent</th>}
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Buyer</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Plan</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Platform</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Price</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Buyer Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Screenshot</th>
              {(isAdmin || onEdit) && <th className="py-3 px-4" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales.map(sale => (
              <>
                <tr
                  key={sale.id}
                  className="table-row-hover"
                  onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                >
                  <td className="py-3 px-4 text-gray-600">{formatDate(sale.sale_date)}</td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {sale.agent?.full_name || sale.agent?.email || '—'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-gray-700 max-w-[160px] truncate">{sale.buyer_email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium">
                      {planLabel(sale.premium_plan)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium',
                      sale.sale_type === 'real_sale'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    )}>
                      {sale.sale_type === 'real_sale' ? '💰 Sale' : '🎁 Giveaway'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{platformLabel(sale.platform)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">${sale.price.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    {sale.is_repeat_buyer ? (
                      <span className="badge-repeat">↩ Repeat</span>
                    ) : (
                      <span className="badge-new">✦ New</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {sale.screenshot_url ? (
                      <button
                        onClick={e => { e.stopPropagation(); setScreenshotUrl(sale.screenshot_url!) }}
                        className="w-10 h-8 rounded-md overflow-hidden border border-gray-200 hover:border-sky-300 transition-colors"
                      >
                        <Image
                          src={sale.screenshot_url}
                          alt="screenshot"
                          width={40}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  {(isAdmin || onEdit) && (
                    <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(sale)}
                            className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        )}
                        {isAdmin && onDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this sale record?')) onDelete(sale.id)
                            }}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedId === sale.id && (
                  <tr key={`${sale.id}-expanded`} className="bg-gray-50/50">
                    <td colSpan={isAdmin ? 10 : 9} className="px-4 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">Purchase #{sale.purchase_count}</span>
                        </div>
                        {sale.previous_plan && (
                          <div>
                            <span className="text-gray-400">Previous plan: </span>
                            <span className="text-gray-700 font-medium">{planLabel(sale.previous_plan)}</span>
                          </div>
                        )}
                        {sale.notes && (
                          <div className="col-span-2">
                            <span className="text-gray-400">Notes: </span>
                            <span className="text-gray-700">{sale.notes}</span>
                          </div>
                        )}
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
                <p className="font-medium text-gray-900 text-sm">{sale.buyer_email}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.sale_date)}</p>
              </div>
              <p className="font-bold text-gray-900">${sale.price.toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium">{planLabel(sale.premium_plan)}</span>
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">{platformLabel(sale.platform)}</span>
              {sale.is_repeat_buyer ? <span className="badge-repeat">↩ Repeat</span> : <span className="badge-new">✦ New</span>}
            </div>
            {isAdmin && sale.agent && (
              <p className="text-xs text-gray-400">Agent: <span className="text-gray-600">{sale.agent.full_name || sale.agent.email}</span></p>
            )}
            {sale.screenshot_url && (
              <button
                onClick={() => setScreenshotUrl(sale.screenshot_url!)}
                className="text-xs text-sky-600 hover:text-sky-700"
              >
                View screenshot →
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
