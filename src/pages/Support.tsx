import { useState, useRef, useEffect } from 'react'
import { PlusCircle, MessageSquare, CheckCircle, Send, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useSupportThreads, useCreateThread, useSendReply } from '@/api/support'
import { useAuth } from '@/lib/auth/AuthContext'

type Thread = NonNullable<ReturnType<typeof useSupportThreads>['data']>[number]

function ThreadCard({ thread, isActive, onClick }: { thread: Thread; isActive: boolean; onClick: () => void }) {
  const msgs = thread.support_messages ?? []
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isActive ? 'bg-accent-primary border-accent-primary' : 'bg-surface-base border-border-default hover:border-border-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-text-primary'}`}>
          {thread.subject}
        </span>
        <Badge variant={thread.status as 'open' | 'resolved'}>{thread.status}</Badge>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <MessageSquare size={10} className={isActive ? 'text-accent-soft' : 'text-text-muted'} />
        <span className={isActive ? 'text-accent-soft' : 'text-text-muted'}>
          {msgs.length} message{msgs.length !== 1 ? 's' : ''} · {new Date(thread.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </button>
  )
}

function ThreadView({ thread, onBack }: { thread: Thread; onBack: () => void }) {
  const [reply, setReply] = useState('')
  const sendReply = useSendReply()
  const { profile } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgs = [...(thread.support_messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  const initials = (profile?.name || 'You').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-border-default gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onBack} className="lg:hidden p-1 rounded-lg hover:bg-surface-subtle shrink-0">
              <ArrowLeft size={16} className="text-text-secondary" />
            </button>
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary truncate text-sm">{thread.subject}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Opened {new Date(thread.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Badge variant={thread.status as 'open' | 'resolved'}>{thread.status}</Badge>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-1">
          {msgs.length === 0 && (
            <p className="text-sm text-text-muted text-center py-8">No messages yet.</p>
          )}
          {msgs.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'investor' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'investor'
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-subtle text-text-secondary border border-border-default'
              }`}>
                {msg.sender === 'investor' ? initials : 'T'}
              </div>
              <div className={`max-w-[75%] flex flex-col ${msg.sender === 'investor' ? 'items-end' : ''}`}>
                <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'investor'
                    ? 'bg-accent-primary text-white rounded-tr-sm'
                    : 'bg-surface-subtle text-text-primary rounded-tl-sm'
                }`}>
                  {msg.body}
                </div>
                <p className="text-xs text-text-muted mt-1 px-1">
                  {msg.sender === 'investor' ? 'You' : 'Tisho Support'} · {new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply box or resolved notice */}
        {thread.status === 'open' ? (
          <div className="border-t border-border-default pt-3 flex gap-2">
            <input
              type="text"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a reply…"
              className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-full border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <Button size="sm" className="gap-1.5 shrink-0" onClick={handleSend} disabled={!reply.trim() || sendReply.isPending}>
              {sendReply.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send
            </Button>
          </div>
        ) : (
          <div className="border-t border-border-default pt-3 flex items-center gap-2 text-sm text-status-success">
            <CheckCircle size={15} /><span>This thread has been resolved.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Support() {
  const { data: threads, isLoading } = useSupportThreads()
  const createThread = useCreateThread()

  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [showThread, setShowThread]     = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [subject, setSubject]           = useState('')
  const [body, setBody]                 = useState('')

  // Auto-select first thread on load
  useEffect(() => {
    if (threads && threads.length > 0 && !activeThread) {
      setActiveThread(threads[0])
    }
  }, [threads, activeThread])

  const handleSelectThread = (t: Thread) => {
    setActiveThread(t)
    setShowThread(true)
  }

  const handleSendNew = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Subject and message are required'); return }
    try {
      await createThread.mutateAsync({ subject: subject.trim(), body: body.trim() })
      setSubject(''); setBody(''); setShowNew(false)
      toast.success('Message sent')
    } catch {
      toast.error('Failed to send message')
    }
  }

  // Keep activeThread in sync when data refreshes
  useEffect(() => {
    if (!threads || !activeThread) return
    const refreshed = threads.find(t => t.id === activeThread.id)
    if (refreshed) setActiveThread(refreshed)
  }, [threads]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {isLoading ? 'Loading…' : `${threads?.length ?? 0} thread(s)`}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(v => !v)}>
          <PlusCircle size={14} /> New Message
        </Button>
      </div>

      {showNew && (
        <Card className="border-dashed border-2 border-border-strong">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">New Support Message</h3>
            <div className="mb-3">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Briefly describe your issue…"
                className="w-full px-4 py-2.5 text-sm rounded-full border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Describe your issue in detail…"
                rows={4}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={handleSendNew} disabled={createThread.isPending}>
                {createThread.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : threads && threads.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <MessageSquare size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary">No support threads yet</p>
            <p className="text-xs text-text-muted mt-1">Click "New Message" to contact our team.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`space-y-2 ${showThread ? 'hidden lg:block' : ''}`}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Threads</p>
            {threads?.map(t => (
              <ThreadCard
                key={t.id}
                thread={t}
                isActive={activeThread?.id === t.id}
                onClick={() => handleSelectThread(t)}
              />
            ))}
          </div>

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
