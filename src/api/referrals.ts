import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'
import type { Database } from '@/types/database'

type ReferralRow = Database['public']['Tables']['referrals']['Row']

export function useReferrals() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['referrals', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ReferralRow[]> => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ReferralRow[]
    },
  })
}
