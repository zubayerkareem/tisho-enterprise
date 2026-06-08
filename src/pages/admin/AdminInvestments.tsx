import { useState } from 'react'
import { Loader2, TrendingUp, CheckCircle, XCircle, ExternalLink, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  useAdminInvestments,
  useApproveInvestment,
  useRejectInvestment,
  useScreenshotUrl,
} from '@/api/admin'

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const TABS = ['all', 'pending', 'active', 'completed'] as const
type Tab = (typeof TABS)[number]

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#fff7ed', color: '#b87333' },
    active:    { bg: '#f0fdf4', color: '#0f7a3d' },
    completed: { bg: '#f0f9ff', color: '#0369a1' },
    withdrawn: { bg: '#f5f5f5', color: '#6b7280' },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}

function ScreenshotLink({ path }: { path: string }) {
  const { data: url, isLoading } = useScreenshotUrl(path)
  if (isLoading) return <Loader2 size={12} className="animate-spin inline" style={{ color: '#7a8a82' }} />
  if (!url) return <span className="text-xs" style={{ color: '#7a8a82' }}>No screenshot</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium underline"
      style={{ color: '#003819' }}
    >
      View Screenshot <ExternalLink size={11} />
    </a>
  )
}

function InvestmentRow({ inv, showActions }: { inv: any; showActions: boolean }) {
  const approve = useApproveInvestment()
  const reject = useRejectInvestment()
  const profile = inv.profiles as any

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(inv.id)
      toast.success('Investment approved')
    } catch {
      toast.error('Failed to approve')
    }
  }

  const handleReject = async () => {
    try {
      await reject.mutateAsync(inv.id)
      toast.success('Investment rejected and deleted')
    } catch {
      toast.error('Failed to reject')
    }
  }

  const isBankPending = inv.status === 'pending' && inv.payment_method === 'bank'
  const isStripePending = inv.status === 'pending' && inv.payment_method === 'stripe'

  return (
    <div className="py-4" style={{ borderBottom: '1px solid #e4e7e5' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold" style={{ color: '#002c14' }}>
              {profile?.name ?? 'Unknown'}
            </p>
            <StatusPill status={inv.status} />
            {inv.payment_method === 'bank' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#f0f9ff', color: '#0369a1' }}>
                Bank Transfer
              </span>
            )}
            {inv.payment_method === 'stripe' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#faf5ff', color: '#7c3aed' }}>
                Stripe
              </span>
            )}
          </div>
          <p className="text-xs mb-0.5" style={{ color: '#4a5d54' }}>
            {profile?.email ?? ''}
          </p>
          <p className="text-sm font-medium" style={{ color: '#002c14' }}>
            {inv.label} · {fmt(inv.amount_pence)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7a8a82' }}>
            Submitted {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>

          {isBankPending && inv.transaction_screenshot_url && (
            <div className="mt-2">
              <ScreenshotLink path={inv.transaction_screenshot_url} />
            </div>
          )}
          {isStripePending && (
            <div className="mt-2 flex items-center gap-1.5">
              <CreditCard size={13} style={{ color: '#7c3aed' }} />
              <span className="text-xs" style={{ color: '#7c3aed' }}>Awaiting Stripe payment</span>
            </div>
          )}
        </div>

        {showActions && inv.status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={approve.isPending || reject.isPending}
              className="gap-1"
              style={{ backgroundColor: '#003819', color: 'white' }}
            >
              {approve.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              disabled={approve.isPending || reject.isPending}
              className="gap-1"
              style={{ borderColor: '#9c2c2c', color: '#9c2c2c', backgroundColor: 'transparent' }}
            >
              {reject.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminInvestments() {
  const [tab, setTab] = useState<Tab>('all')
  const { data: investments, isLoading } = useAdminInvestments(tab === 'all' ? undefined : tab)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Investments</h1>

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
          ) : !investments || investments.length === 0 ? (
            <div className="py-12 text-center">
              <TrendingUp size={32} className="mx-auto mb-3" style={{ color: '#7a8a82' }} />
              <p className="text-sm font-medium" style={{ color: '#002c14' }}>No investments found</p>
              <p className="text-xs mt-1" style={{ color: '#7a8a82' }}>
                {tab === 'all' ? 'No investments yet' : `No ${tab} investments`}
              </p>
            </div>
          ) : (
            <div>
              {investments.map((inv: any) => (
                <InvestmentRow
                  key={inv.id}
                  inv={inv}
                  showActions={tab === 'pending' || tab === 'all'}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
