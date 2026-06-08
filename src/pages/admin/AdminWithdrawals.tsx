import { useState } from 'react'
import { Loader2, ArrowUpFromLine, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAdminWithdrawals, useUpdateWithdrawal } from '@/api/admin'

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:      { bg: '#fff7ed', color: '#b87333' },
    under_review: { bg: '#f0f9ff', color: '#0369a1' },
    approved:     { bg: '#f0fdf4', color: '#0f7a3d' },
    rejected:     { bg: '#fff1f2', color: '#9c2c2c' },
    paid:         { bg: '#f0fdf4', color: '#0f7a3d' },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

function WithdrawalRow({ withdrawal }: { withdrawal: any }) {
  const [note, setNote] = useState(withdrawal.admin_note ?? '')
  const [showNote, setShowNote] = useState(false)
  const update = useUpdateWithdrawal()
  const profile = withdrawal.profiles as any
  const investment = withdrawal.investments as any

  const handleAction = async (status: string) => {
    try {
      await update.mutateAsync({ withdrawalId: withdrawal.id, status, adminNote: note || undefined })
      toast.success(`Withdrawal ${status}`)
      setShowNote(false)
    } catch {
      toast.error('Failed to update withdrawal')
    }
  }

  const isPending = withdrawal.status === 'pending' || withdrawal.status === 'under_review'

  return (
    <div className="py-4" style={{ borderBottom: '1px solid #e4e7e5' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold" style={{ color: '#002c14' }}>
              {profile?.name ?? 'Unknown'}
            </p>
            <StatusPill status={withdrawal.status} />
          </div>
          <p className="text-xs" style={{ color: '#4a5d54' }}>{profile?.email ?? ''}</p>
          <p className="text-sm font-medium mt-1" style={{ color: '#002c14' }}>
            {fmt(withdrawal.amount_pence)} · {investment?.label ?? 'Investment'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7a8a82' }}>
            Requested {new Date(withdrawal.request_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {withdrawal.reason && (
            <p className="text-xs mt-1 italic" style={{ color: '#4a5d54' }}>
              "{withdrawal.reason}"
            </p>
          )}
          {withdrawal.admin_note && !showNote && (
            <p className="text-xs mt-1" style={{ color: '#7a8a82' }}>
              Admin note: {withdrawal.admin_note}
            </p>
          )}
        </div>

        {isPending && (
          <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
            {showNote && (
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional admin note…"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border resize-none focus:outline-none"
                style={{ borderColor: '#e4e7e5' }}
                onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #003819'}
                onBlur={e => e.currentTarget.style.boxShadow = 'none'}
              />
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAction('approved')}
                disabled={update.isPending}
                className="gap-1 flex-1"
                style={{ backgroundColor: '#003819', color: 'white' }}
              >
                {update.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction('rejected')}
                disabled={update.isPending}
                className="gap-1 flex-1"
                style={{ borderColor: '#9c2c2c', color: '#9c2c2c', backgroundColor: 'transparent' }}
              >
                {update.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Reject
              </Button>
            </div>
            <button
              onClick={() => setShowNote(v => !v)}
              className="text-xs text-center"
              style={{ color: '#7a8a82' }}
            >
              {showNote ? 'Hide note' : '+ Add note'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const TABS = ['pending', 'all'] as const
type Tab = (typeof TABS)[number]

export function AdminWithdrawals() {
  const [tab, setTab] = useState<Tab>('pending')
  const { data: withdrawals, isLoading } = useAdminWithdrawals()

  const filtered = tab === 'pending'
    ? (withdrawals ?? []).filter((w: any) => w.status === 'pending' || w.status === 'under_review')
    : (withdrawals ?? [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Withdrawals</h1>
        <p className="text-sm" style={{ color: '#7a8a82' }}>
          {(withdrawals ?? []).filter((w: any) => w.status === 'pending').length} pending
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#f7f9f8', border: '1px solid #e4e7e5' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              backgroundColor: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#002c14' : '#7a8a82',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: '#7a8a82' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <ArrowUpFromLine size={32} className="mx-auto mb-3" style={{ color: '#7a8a82' }} />
              <p className="text-sm font-medium" style={{ color: '#002c14' }}>No withdrawals</p>
              <p className="text-xs mt-1" style={{ color: '#7a8a82' }}>
                {tab === 'pending' ? 'No pending withdrawal requests' : 'No withdrawals yet'}
              </p>
            </div>
          ) : (
            filtered.map((w: any) => <WithdrawalRow key={w.id} withdrawal={w} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
