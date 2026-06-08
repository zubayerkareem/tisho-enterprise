import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

const db = supabase as any

export type PolicyType = 'capital_return' | 'compact'

export interface ApplicationData {
  gender: string
  marital_status: string
  date_of_birth: string
  nationality: string
  occupation: string
  postal_address: string
  physical_address: string
  phone: string
  fax?: string
  website?: string
  account_name: string
  account_number: string
  sort_code?: string
  bank_and_branch: string
  payout_frequency: string
  id_details: string
  next_of_kin: string
  next_of_kin_contact: string
  facebook?: string
  twitter?: string
  other_social?: string
  payment_mode: string
  self_description: string
  agreed_at: string
}

export function useMyApplication(policyType: PolicyType = 'capital_return') {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-application', user?.id, policyType],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_applications')
        .select('*')
        .eq('user_id', user!.id)
        .eq('policy_type', policyType)
        .maybeSingle()
      if (error) throw error
      return data as ApplicationData & {
        id: string; user_id: string; policy_type: PolicyType; status: string;
        admin_note: string | null; submitted_at: string | null; reviewed_at: string | null
      } | null
    },
  })
}

export function useSubmitApplication(policyType: PolicyType = 'capital_return') {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (data: ApplicationData) => {
      const { error } = await db
        .from('investor_applications')
        .upsert(
          {
            user_id: user!.id,
            policy_type: policyType,
            ...data,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,policy_type' }
        )
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-application'] })
    },
  })
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useAdminApplications(status?: string) {
  return useQuery({
    queryKey: ['admin', 'applications', status ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('investor_applications')
        .select('*, profiles!user_id(name, email, kyc_status)')
        .order('submitted_at', { ascending: false })
      if (status && status !== 'all') q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

export function useReviewApplication() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      applicationId,
      userId,
      status,
      adminNote,
    }: { applicationId: string; userId: string; status: 'approved' | 'rejected'; adminNote?: string }) => {
      const now = new Date().toISOString()
      const { error: appErr } = await db
        .from('investor_applications')
        .update({
          status,
          admin_note: adminNote ?? null,
          reviewed_at: now,
          reviewed_by: user!.id,
          updated_at: now,
        })
        .eq('id', applicationId)
      if (appErr) throw appErr

      const { error: profileErr } = await db
        .from('profiles')
        .update({ kyc_status: status === 'approved' ? 'approved' : 'rejected' })
        .eq('id', userId)
      if (profileErr) throw profileErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
