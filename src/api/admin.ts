import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Cast to any for mutation calls where Supabase types resolve to `never`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const [
        { count: totalUsers },
        { count: pendingApprovals },
        { count: activeInvestments },
        { data: aumData },
        { count: upcomingPaymentsCount },
        { count: openSupportThreads },
        { count: pendingWithdrawals },
        { count: pendingApplications },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'investor'),
        supabase.from('investments').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('payment_method', 'bank'),
        supabase.from('investments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('investments').select('amount_pence').eq('status', 'active'),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending').lte('date', sevenDaysLater).gte('date', today),
        supabase.from('support_threads').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('investor_applications').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      ])

      const totalAumPence = (aumData ?? []).reduce((sum, r) => sum + (r.amount_pence ?? 0), 0)

      return {
        totalUsers: totalUsers ?? 0,
        pendingApprovals: pendingApprovals ?? 0,
        activeInvestments: activeInvestments ?? 0,
        totalAumPence,
        upcomingPaymentsCount: upcomingPaymentsCount ?? 0,
        openSupportThreads: openSupportThreads ?? 0,
        pendingWithdrawals:   pendingWithdrawals   ?? 0,
        pendingApplications:  pendingApplications  ?? 0,
      }
    },
  })
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, investments(id, amount_pence, status)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
      const { error } = await db
        .from('profiles')
        .update({ suspended })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// ─── Investments ──────────────────────────────────────────────────────────────

export function useAdminInvestments(status?: string) {
  return useQuery({
    queryKey: ['admin', 'investments', status ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('investments')
        .select('*, profiles!user_id(name, email)')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        q = q.eq('status', status)
      }

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

export function useApproveInvestment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (investmentId: string) => {
      const today = new Date()
      const startDate = today.toISOString().split('T')[0]
      const endDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())
        .toISOString()
        .split('T')[0]
      const nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
        .toISOString()
        .split('T')[0]

      const { error } = await db
        .from('investments')
        .update({
          status: 'active',
          start_date: startDate,
          end_date: endDate,
          next_payment_date: nextPaymentDate,
        })
        .eq('id', investmentId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'investments'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useRejectInvestment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (investmentId: string) => {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'investments'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useScreenshotUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['screenshot-url', path],
    enabled: !!path,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('transaction-screenshots')
        .createSignedUrl(path!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function useAdminPayments() {
  return useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, investments!investment_id(label, amount_pence, user_id), profiles!user_id(name, email)')
        .eq('status', 'pending')
        .order('date', { ascending: true })

      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

export function useMarkPaymentPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await db
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'payments'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export function useAdminReferrals() {
  return useQuery({
    queryKey: ['admin', 'referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, referrer:profiles!referrer_id(name, email), referred:profiles!referred_id(name, email)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

// ─── Support ──────────────────────────────────────────────────────────────────

export function useAdminSupportThreads() {
  return useQuery({
    queryKey: ['admin', 'support'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_threads')
        .select('*, profiles!user_id(name, email), support_messages(id, sender, body, attachment_url, created_at)')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

export function useAdminReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const { error } = await db
        .from('support_messages')
        .insert({ thread_id: threadId, sender: 'admin', body })

      if (error) throw error

      // bump updated_at
      await db
        .from('support_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'support'] })
    },
  })
}

export function useResolveThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await db
        .from('support_threads')
        .update({ status: 'resolved' })
        .eq('id', threadId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'support'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export function useAdminWithdrawals() {
  return useQuery({
    queryKey: ['admin', 'withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, investments!investment_id(label, amount_pence), profiles!user_id(name, email)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

export function useUpdateWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      withdrawalId,
      status,
      adminNote,
    }: {
      withdrawalId: string
      status: string
      adminNote?: string
    }) => {
      const update: Record<string, any> = { status }
      if (adminNote !== undefined) update.admin_note = adminNote
      if (status === 'approved' || status === 'rejected' || status === 'paid') {
        update.resolved_date = new Date().toISOString().split('T')[0]
      }

      const { error } = await db
        .from('withdrawals')
        .update(update)
        .eq('id', withdrawalId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
