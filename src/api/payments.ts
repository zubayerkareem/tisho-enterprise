import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

export function usePayments(filters?: { investmentId?: string; status?: string }) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['payments', user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('payments')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      if (filters?.investmentId) q = q.eq('investment_id', filters.investmentId)
      if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status as 'completed' | 'pending' | 'failed')

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useMonthlyChartData(months = 12) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['monthly-chart', user?.id, months],
    enabled: !!user,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('monthly_chart_data', {
        p_user_id: user!.id,
        p_months: months,
      })
      if (error) throw error
      return data as { month: string; received: number }[]
    },
  })
}
