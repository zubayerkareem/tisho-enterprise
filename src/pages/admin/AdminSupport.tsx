import { useState, useRef, useEffect } from 'react'
import { Loader2, MessageSquare, Send, CheckCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAdminSupportThreads, useAdminReply, useResolveThread } from '@/api/admin'

type Thread = any

function ThreadCard({ thread, isActive, onClick }: { thread: Thread; isActive: boolean; onClick: () => void }) {
  const msgs = (thread.support_messages ?? []) as any[]
  const profile = thread.profiles as any
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border transition-all"
      style={{
        backgroundColor: isActive ? '#003819' : 'white',
        borderColor: isActive ? '#003819' : '#e4e7e5',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#4a5d54' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#e4e7e5' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-semibold truncate" style={{ color: isActive ? 'white' : '#002c14' }}>
          {thread.subject}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0 capitalize"
          style={{
            backgroundColor: thread.status === 'open'
              ? (isActive ? 'rgba(255,255,255,0.2)' : '#f0fdf4')
              : (isActive ? 'rgba(255,255,255,0.15)' : '#f5f5f5'),
            color: thread.status === 'open'
              ? (isActive ? 'white' : '#0f7a3d')
              : (isActive ? 'rgba(255,255,255,0.6)' : '#6b7280'),
          }}
        >
          {thread.status}
        </span>
      </div>
      <p className="text-xs truncate mb-1" style={{ color: isActive ? 'rgba(255,255,255,0.6)' : '#7a8a82' }}>
        {profile?.name ?? 'Unknown'} · {profile?.email ?? ''}
      </p>
      <div className="flex items-center gap-2 text-xs" style={{ color: isActive ? 'rgba(255,255,255,0.5)' : '#7a8a82' }}>
        <MessageSquare size={10} />
        <span>
          {msgs.length} message{msgs.length !== 1 ? 's' : ''} · {new Date(thread.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </button>
  )
}

function ThreadView({ thread, onBack }: { thread: Thread; onBack: () => void }) {
  const [reply, setReply] = useState('')
  const sendReply = useAdminReply()
  const resolveThread = useResolveThread()
  const bottomRef = useRef<HTMLDivElement>(null)
  const profile = thread.profiles as any

  const msgs = [...(thread.support_messages ?? [])].sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  const handleSend = async () => {
    const body = reply.trim()
    if (!body) return
    setReply('')
    try {
      await sendReply.mutateAsync({ threadId: thread.id, body })
    } catch {
      toast.error('Failed to send reply')
    }
  }

  const handleResolve = async () => {
    try {
      await resolveThread.mutateAsync(thread.id)
      toast.success('Thread resolved')
    } catch {
      toast.error('Failed to resolve thread')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 pb-3 gap-2" style={{ borderBottom: '1px solid #e4e7e5' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="lg:hidden p-1 rounded-lg shrink-0"
              style={{ color: '#4a5d54' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h3 className="font-semibold truncate text-sm" style={{ color: '#002c14' }}>{thread.subject}</h3>
              <p className="text-xs mt-0.5" style={{ color: '#7a8a82' }}>
                From: {profile?.name ?? 'Unknown'} · {profile?.email ?? ''} · Opened {new Date(thread.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {thread.status === 'open' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResolve}
                disabled={resolveThread.isPending}
                className="gap-1 text-xs"
                style={{ borderColor: '#0f7a3d', color: '#0f7a3d', backgroundColor: 'transparent' }}
              >
                {resolveThread.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                Resolve
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-1">
          {msgs.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: '#7a8a82' }}>No messages yet.</p>
          )}
          {msgs.map((msg: any) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={
                  msg.sender === 'admin'
                    ? { backgroundColor: '#003819', color: 'white' }
                    : { backgroundColor: '#f7f9f8', color: '#4a5d54', border: '1px solid #e4e7e5' }
                }
              >
                {msg.sender === 'admin' ? 'A' : (profile?.name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[75%] flex flex-col ${msg.sender === 'admin' ? 'items-end' : ''}`}>
                <div
                  className="px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.sender === 'admin'
                      ? { backgroundColor: '#003819', color: 'white', borderTopRightRadius: '4px' }
                      : { backgroundColor: '#f7f9f8', color: '#002c14', borderTopLeftRadius: '4px' }
                  }
                >
                  {msg.body}
                </div>
                <p className="text-xs mt-1 px-1" style={{ color: '#7a8a82' }}>
                  {msg.sender === 'admin' ? 'You (Admin)' : (profile?.name ?? 'Investor')} · {new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply or resolved */}
        {thread.status === 'open' ? (
          <div className="pt-3 flex gap-2" style={{ borderTop: '1px solid #e4e7e5' }}>
            <input
              type="text"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a reply…"
              className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-full border focus:outline-none"
              style={{ borderColor: '#e4e7e5' }}
              onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #003819'}
              onBlur={e => e.currentTarget.style.boxShadow = 'none'}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!reply.trim() || sendReply.isPending}
              className="gap-1.5 shrink-0"
              style={{ backgroundColor: '#003819', color: 'white' }}
            >
              {sendReply.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send
            </Button>
          </div>
        ) : (
          <div className="pt-3 flex items-center gap-2 text-sm" style={{ borderTop: '1px solid #e4e7e5', color: '#0f7a3d' }}>
            <CheckCircle size={15} />
            <span>This thread has been resolved.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AdminSupport() {
  const { data: threads, isLoading } = useAdminSupportThreads()
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [showThread, setShowThread] = useState(false)

  useEffect(() => {
    if (threads && threads.length > 0 && !activeThread) {
      setActiveThread(threads[0])
    }
  }, [threads, activeThread])

  // Sync active thread when data refreshes
  useEffect(() => {
    if (!threads || !activeThread) return
    const refreshed = threads.find((t: any) => t.id === activeThread.id)
    if (refreshed) setActiveThread(refreshed)
  }, [threads]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectThread = (t: Thread) => {
    setActiveThread(t)
    setShowThread(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Support</h1>
        <p className="text-sm" style={{ color: '#7a8a82' }}>
          {(threads ?? []).filter((t: any) => t.status === 'open').length} open thread{(threads ?? []).filter((t: any) => t.status === 'open').length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: '#7a8a82' }} />
        </div>
      ) : !threads || threads.length === 0 ? (
        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardContent className="pt-12 pb-12 text-center">
            <MessageSquare size={32} className="mx-auto mb-3" style={{ color: '#7a8a82' }} />
            <p className="text-sm font-medium" style={{ color: '#002c14' }}>No support threads</p>
            <p className="text-xs mt-1" style={{ color: '#7a8a82' }}>Support threads will appear here when investors open them.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Thread list */}
          <div className={`space-y-2 ${showThread ? 'hidden lg:block' : ''}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7a8a82' }}>
              Threads
            </p>
            {threads.map((t: any) => (
              <ThreadCard
                key={t.id}
                thread={t}
                isActive={activeThread?.id === t.id}
                onClick={() => handleSelectThread(t)}
              />
            ))}
          </div>

          {/* Thread detail */}
          {activeThread && (
            <div className={`lg:col-span-2 ${!showThread ? 'hidden lg:block' : ''}`}>
              <ThreadView thread={activeThread} onBack={() => setShowThread(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
