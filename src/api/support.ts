import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

export function useSupportThreads() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['support-threads', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_threads')
        .select('*, support_messages(*)')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateThread() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ subject, body }: { subject: string; body: string }) => {
      const { data: thread, error: te } = await (
        supabase.from('support_threads').insert as any
      )({ user_id: user!.id, subject, status: 'open' }).select().single()
      if (te) throw te

      const { error: me } = await (supabase.from('support_messages').insert as any)({
        thread_id: thread.id,
        sender: 'investor',
        body,
      })
      if (me) throw me
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-threads', user?.id] }),
  })
}

export function useSendReply() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const { error } = await (supabase.from('support_messages').insert as any)({
        thread_id: threadId,
        sender: 'investor',
        body,
      })
      if (error) throw error
      await (supabase.from('support_threads').update as any)({
        updated_at: new Date().toISOString(),
      }).eq('id', threadId)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-threads', user?.id] }),
  })
}
