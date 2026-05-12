import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfWeek, startOfMonth, subDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MMK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function getDateRangeFilter(range: string): { from: string; to: string } {
  const now = new Date()
  const to = format(now, 'yyyy-MM-dd')

  switch (range) {
    case 'today':
      return { from: to, to }
    case 'week':
      return { from: format(startOfWeek(now), 'yyyy-MM-dd'), to }
    case 'month':
      return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to }
    case '30days':
      return { from: format(subDays(now, 30), 'yyyy-MM-dd'), to }
    case '90days':
      return { from: format(subDays(now, 90), 'yyyy-MM-dd'), to }
    case 'year':
      return { from: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'), to }
    default:
      return { from: format(subDays(now, 30), 'yyyy-MM-dd'), to }
  }
}

export const PLAN_ORDER = ['weekly', 'monthly', 'three_months', 'six_months', 'yearly']

export function getPlanChangeType(prev: string, next: string): 'upgrade' | 'downgrade' | 'renewal' {
  const pi = PLAN_ORDER.indexOf(prev)
  const ni = PLAN_ORDER.indexOf(next)
  if (pi === ni) return 'renewal'
  if (ni > pi) return 'upgrade'
  return 'downgrade'
}

export function planLabel(plan: string): string {
  const map: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    three_months: '3 Months',
    six_months: '6 Months',
    yearly: 'Yearly',
  }
  return map[plan] ?? plan
}

export function platformLabel(platform: string): string {
  const map: Record<string, string> = {
    telegram: 'Telegram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
  }
  return map[platform] ?? platform
}
