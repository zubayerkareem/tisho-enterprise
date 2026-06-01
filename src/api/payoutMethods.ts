import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

interface PayoutMethodPayload {
  type: 'bank'
  label: string
  account_name: string
  account_number_masked: string
  sort_code_masked: string
  is_primary?: boolean
}

export function usePayoutMethods() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['payout-methods', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_methods')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_primary', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAddPayoutMethod() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (payload: PayoutMethodPayload) => {
      const { error } = await (supabase.from('payout_methods').insert as any)({
        ...payload,
        user_id: user!.id,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-methods', user?.id] }),
  })
}

export function useUpdatePayoutMethod() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & Partial<PayoutMethodPayload>) => {
      const { error } = await (supabase.from('payout_methods').update as any)(update)
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-methods', user?.id] }),
  })
}

export function useDeletePayoutMethod() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payout_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-methods', user?.id] }),
  })
}

export function useSetPrimaryPayoutMethod() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('payout_methods').update as any)({ is_primary: false })
        .eq('user_id', user!.id)
      const { error } = await (supabase.from('payout_methods').update as any)({ is_primary: true })
        .eq('id', id)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-methods', user?.id] }),
  })
}
