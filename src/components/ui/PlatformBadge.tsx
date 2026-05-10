import { cn } from '@/lib/utils'

const PLATFORM_COLORS: Record<string, string> = {
  telegram: 'bg-blue-50 text-blue-700',
  facebook: 'bg-indigo-50 text-indigo-700',
  tiktok: 'bg-pink-50 text-pink-700',
}

const PLATFORM_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
}

export default function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      PLATFORM_COLORS[platform] || 'bg-gray-100 text-gray-600'
    )}>
      {PLATFORM_LABELS[platform] || platform}
    </span>
  )
}
