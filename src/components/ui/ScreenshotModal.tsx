'use client'

import { useEffect } from 'react'
import { X, Download } from 'lucide-react'
import Image from 'next/image'

interface ScreenshotModalProps {
  url: string
  onClose: () => void
}

export default function ScreenshotModal({ url, onClose }: ScreenshotModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">Sale Screenshot</span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="overflow-auto max-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
          <Image
            src={url}
            alt="Sale screenshot"
            width={800}
            height={600}
            className="max-w-full h-auto rounded-lg object-contain"
            unoptimized
          />
        </div>
      </div>
    </div>
  )
}
