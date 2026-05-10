import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-sky-500',
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <div className={cn('notion-card', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center', iconColor.replace('text-', 'bg-').replace('500', '50'))}>
            <Icon className={cn('w-4 h-4', iconColor)} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {trend && trendValue && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium',
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
        )}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}
