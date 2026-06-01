import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

interface ProfileUpdate {
  name?: string
  phone?: string
  country?: string
  avatar_url?: string
}

interface NotifPrefsUpdate {
  payment_received?: boolean
  withdrawal_update?: boolean
  kyc_update?: boolean
  support_reply?: boolean
}

export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth()
  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      const { error } = await (supabase.from('profiles').update as any)(update)
        .eq('id', user!.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await refreshProfile()
      toast.success('Profile updated')
    },
    onError: (e: Error) => toast.error('Update failed', { description: e.message }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: () => toast.success('Password updated'),
    onError: (e: Error) => toast.error('Password change failed', { description: e.message }),
  })
}

export function useNotificationPrefs() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notification-prefs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_prefs')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateNotificationPrefs() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (prefs: NotifPrefsUpdate) => {
      const { error } = await (supabase.from('notification_prefs').update as any)(prefs)
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-prefs', user?.id] })
      toast.success('Preferences saved')
    },
    onError: (e: Error) => toast.error('Save failed', { description: e.message }),
  })
}
