import { cn } from '@/lib/utils'
import { planLabel } from '@/lib/utils'

const PLAN_COLORS: Record<string, string> = {
  weekly:       'bg-gray-100 text-gray-700',
  monthly:      'bg-sky-50 text-sky-700',
  three_months: 'bg-blue-50 text-blue-700',
  six_months:   'bg-indigo-50 text-indigo-700',
  yearly:       'bg-purple-50 text-purple-700',
}

export default function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      PLAN_COLORS[plan] || 'bg-gray-100 text-gray-600'
    )}>
      {planLabel(plan)}
    </span>
  )
}
