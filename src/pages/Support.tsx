import { PlusCircle, MessageSquare, CheckCircle, Send, Paperclip, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mockSupportMessages } from '@/data/mockData'

function ThreadCard({ thread, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isActive
          ? 'bg-[#003819] border-[#003819]'
          : 'bg-white border-[#e4e7e5] hover:border-[#c5cdc9]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-[#002c14]'}`}>
          {thread.subject}
        </span>
        <Badge variant={thread.status}>{thread.status}</Badge>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <MessageSquare size={10} className={isActive ? 'text-[#abc6b7]' : 'text-[#7a8a82]'} />
        <span className={isActive ? 'text-[#abc6b7]' : 'text-[#7a8a82]'}>
          {thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''} · {new Date(thread.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </button>
  )
}

function ThreadView({ thread, onBack }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-[#e4e7e5] gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button onClick={onBack} className="lg:hidden p-1 rounded-lg hover:bg-[#f7f9f8] shrink-0">
                <ArrowLeft size={16} className="text-[#4a5d54]" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-[#002c14] truncate text-sm">{thread.subject}</h3>
              <p className="text-xs text-[#7a8a82] mt-0.5">Opened {new Date(thread.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
          <Badge variant={thread.status}>{thread.status}</Badge>
        </div>

        <div className="space-y-4 mb-4">
          {thread.messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.from === 'investor' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.from === 'investor' ? 'bg-[#003819] text-white' : 'bg-[#f7f9f8] text-[#4a5d54] border border-[#e4e7e5]'
              }`}>
                {msg.from === 'investor' ? 'AP' : 'T'}
              </div>
              <div className={`max-w-[75%] flex flex-col ${msg.from === 'investor' ? 'items-end' : ''}`}>
                <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.from === 'investor' ? 'bg-[#003819] text-white rounded-tr-sm' : 'bg-[#f7f9f8] text-[#002c14] rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
                <p className="text-xs text-[#7a8a82] mt-1 px-1">
                  {msg.from === 'investor' ? 'You' : 'Tisho Support'} · {msg.date}
                </p>
              </div>
            </div>
          ))}
        </div>

        {thread.status === 'open' ? (
          <div className="border-t border-[#e4e7e5] pt-3 flex gap-2">
            <input
              type="text"
              placeholder="Type a reply..."
              className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819]"
            />
            <Button size="sm" className="gap-1.5 shrink-0"><Send size={13} /> Send</Button>
          </div>
        ) : (
          <div className="border-t border-[#e4e7e5] pt-3 flex items-center gap-2 text-sm text-[#0f7a3d]">
            <CheckCircle size={15} /><span>This thread has been resolved.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Support() {
  const [activeThread, setActiveThread] = useState(mockSupportMessages[0])
  const [showThread, setShowThread] = useState(false)   // mobile: show thread view
  const [showNew, setShowNew] = useState(false)

  const handleSelectThread = (t) => {
    setActiveThread(t)
    setShowThread(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7a8a82]">{mockSupportMessages.length} thread(s)</p>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(v => !v)}>
          <PlusCircle size={14} /> New Message
        </Button>
      </div>

      {showNew && (
        <Card className="border-dashed border-2 border-[#c5cdc9]">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-[#002c14] mb-3">New Support Message</h3>
            <div className="mb-3">
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Subject</label>
              <input type="text" placeholder="Briefly describe your issue..." className="w-full px-4 py-2.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Message</label>
              <textarea placeholder="Describe your issue in detail..." rows={4} className="w-full px-4 py-3 text-sm rounded-2xl border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] resize-none" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" className="gap-1.5"><Send size={13} /> Send</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-[#7a8a82]"><Paperclip size={13} /> Attach</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop: side-by-side. Mobile: list → thread nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Thread list — hidden on mobile when thread is open */}
        <div className={`space-y-2 ${showThread ? 'hidden lg:block' : ''}`}>
          <p className="text-xs font-semibold text-[#7a8a82] uppercase tracking-wider mb-2">Threads</p>
          {mockSupportMessages.map(t => (
            <ThreadCard
              key={t.id}
              thread={t}
              isActive={activeThread?.id === t.id}
              onClick={() => handleSelectThread(t)}
            />
          ))}
        </div>

        {/* Thread view — hidden on mobile when list is shown */}
        {activeThread && (
          <div className={`lg:col-span-2 ${!showThread ? 'hidden lg:block' : ''}`}>
            <ThreadView
              thread={activeThread}
              onBack={() => setShowThread(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
