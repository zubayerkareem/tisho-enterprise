import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'
import type { Database, InvestmentType } from '@/types/database'

export type InvestmentRow = Database['public']['Tables']['investments']['Row']

export function useInvestments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['investments', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<InvestmentRow[]> => {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as InvestmentRow[]
    },
  })
}

export function getCompactRatePercent(amountPence: number): number {
  if (amountPence <= 500000)   return 6
  if (amountPence <= 5000000)  return 7
  if (amountPence <= 50000000) return 8
  if (amountPence <= 500000000) return 9
  return 10
}

// ─── Shared investment row builder ───────────────────────────────────────────

function buildInvestmentInsert(
  userId: string,
  type: InvestmentType,
  amountGbp: number,
  months: number,
  paymentMethod: 'bank' | 'stripe',
  screenshotPath?: string,
) {
  const amountPence = Math.round(amountGbp * 100)

  const today = new Date()
  const startDate = today.toISOString().split('T')[0]
  const endDt = new Date(today)
  endDt.setMonth(endDt.getMonth() + months)
  const endDate = endDt.toISOString().split('T')[0]

  let ratePercent: number
  let ratePerYearPence: number | null = null
  let ratePerMonthPence: number | null = null
  let principalReturnPence: number

  if (type === 'comprehensive') {
    ratePercent = 25
    ratePerYearPence = Math.round(amountPence * 0.25)
    ratePerMonthPence = Math.round(ratePerYearPence / 12)
    principalReturnPence = amountPence
  } else {
    ratePercent = getCompactRatePercent(amountPence)
    ratePerMonthPence = Math.round(amountPence * ratePercent / 100)
    principalReturnPence = 0
  }

  return {
    user_id: userId,
    type,
    label: type === 'comprehensive' ? 'Comprehensive Policy' : 'Compact Policy',
    amount_pence: amountPence,
    currency: 'GBP',
    start_date: startDate,
    end_date: endDate,
    months_total: months,
    payout_frequency: 'monthly' as const,
    rate_percent: ratePercent,
    rate_per_year_pence: ratePerYearPence,
    rate_per_month_pence: ratePerMonthPence,
    principal_return_pence: principalReturnPence,
    status: 'pending' as const,
    profit_mode: 'automatic' as const,
    payment_method: paymentMethod,
    transaction_screenshot_url: screenshotPath ?? null,
  }
}

// ─── Bank transfer investment ─────────────────────────────────────────────────

interface CreateBankInvestmentInput {
  type: InvestmentType
  amountGbp: number
  months: number
  screenshotFile: File
}

export function useCreateInvestment() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ type, amountGbp, months, screenshotFile }: CreateBankInvestmentInput) => {
      const ext = screenshotFile.name.split('.').pop() ?? 'jpg'
      const storagePath = `${user!.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('transaction-screenshots')
        .upload(storagePath, screenshotFile)
      if (uploadError) throw uploadError

      const { error } = await (supabase.from('investments').insert as any)(
        buildInvestmentInsert(user!.id, type, amountGbp, months, 'bank', storagePath)
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments', user?.id] }),
  })
}

// ─── Stripe investment ────────────────────────────────────────────────────────

interface CreateStripeInvestmentInput {
  type: InvestmentType
  amountGbp: number
  months: number
}

/** Creates the investment row then calls the Edge Function to get a Stripe Checkout URL. */
export function useCreateStripeInvestment() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ type, amountGbp, months }: CreateStripeInvestmentInput): Promise<string> => {
      const amountPence = Math.round(amountGbp * 100)

      // Insert the investment record first
      const { data, error } = await (supabase.from('investments').insert as any)(
        buildInvestmentInsert(user!.id, type, amountGbp, months, 'stripe')
      ).select('id').single()
      if (error) throw error

      const investmentId = (data as { id: string }).id
      const label = type === 'comprehensive' ? 'Comprehensive Policy' : 'Compact Policy'

      // Get the current session JWT
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Not authenticated')

      // Call the Edge Function
      const res = await supabase.functions.invoke('create-stripe-checkout', {
        body: { investmentId, amountPence, label, currency: 'gbp' },
      })
      if (res.error) throw new Error(res.error.message)

      const { url } = res.data as { url: string }
      if (!url) throw new Error('No checkout URL returned')

      return url
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investments', user?.id] }),
  })
}
