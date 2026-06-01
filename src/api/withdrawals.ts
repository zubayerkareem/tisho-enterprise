import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

export function useWithdrawals() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['withdrawals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, payout_methods(label)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateWithdrawal() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (payload: {
      investment_id: string
      amount_pence: number
      reason: string
      payout_method_id?: string | null
    }) => {
      const { error } = await (supabase.from('withdrawals').insert as any)({
        ...payload,
        user_id: user!.id,
        status: 'pending',
        request_date: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawals', user?.id] })
    },
  })
}
