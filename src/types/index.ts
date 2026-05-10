export type Role = 'admin' | 'agent'

export type PremiumPlan = 'weekly' | 'monthly' | 'three_months' | 'six_months' | 'yearly'

export type SaleType = 'real_sale' | 'giveaway'

export type Platform = 'telegram' | 'facebook' | 'tiktok'

export interface Profile {
  id: string
  email: string
  role: Role
  full_name: string
  created_at: string
}

export interface Sale {
  id: string
  agent_id: string
  buyer_email: string
  premium_plan: PremiumPlan
  sale_date: string
  sale_type: SaleType
  platform: Platform
  price: number
  screenshot_url: string | null
  notes: string | null
  created_at: string
  is_repeat_buyer: boolean
  purchase_count: number
  previous_plan: string | null
  // Joined
  agent?: Profile
}

export interface BuyerHistory {
  id: string
  buyer_email: string
  total_purchases: number
  total_spent: number
  first_purchase_date: string
  last_purchase_date: string
  plans_purchased: string[]
  platforms_used: string[]
  assigned_agents: string[]
}

export interface DashboardStats {
  total_revenue: number
  total_revenue_month: number
  total_revenue_week: number
  total_sales: number
  total_unique_buyers: number
  total_repeat_buyers: number
  repeat_buyer_percentage: number
  top_agent: Profile | null
}

export interface AgentStats extends Profile {
  total_sales: number
  total_revenue: number
  repeat_buyers: number
  new_buyers: number
}

export const PLAN_ORDER: PremiumPlan[] = ['weekly', 'monthly', 'three_months', 'six_months', 'yearly']

export const PLAN_LABELS: Record<PremiumPlan, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  three_months: '3 Months',
  six_months: '6 Months',
  yearly: 'Yearly',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  telegram: 'Telegram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
}

export function getPlanChangeType(
  prevPlan: PremiumPlan | string,
  newPlan: PremiumPlan | string
): 'upgrade' | 'downgrade' | 'renewal' {
  const prevIdx = PLAN_ORDER.indexOf(prevPlan as PremiumPlan)
  const newIdx = PLAN_ORDER.indexOf(newPlan as PremiumPlan)
  if (prevIdx === newIdx) return 'renewal'
  if (newIdx > prevIdx) return 'upgrade'
  return 'downgrade'
}
