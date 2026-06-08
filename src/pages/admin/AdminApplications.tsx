import { useState } from 'react'
import { Loader2, FileText, CheckCircle, XCircle, Download, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAdminApplications, useReviewApplication } from '@/api/applications'
import { printApplicationPDF } from '@/lib/applicationPDF'

const TABS = ['all', 'submitted', 'approved', 'rejected'] as const
type Tab = (typeof TABS)[number]

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    submitted: { bg: '#fff7ed', color: '#b87333' },
    approved:  { bg: '#f0fdf4', color: '#0f7a3d' },
    rejected:  { bg: '#fef2f2', color: '#9c2c2c' },
  }
  const s = map[status] ?? map.submitted
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

function ApplicationRow({ app }: { app: any }) {
  const review = useReviewApplication()
  const [expanded, setExpanded] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const profile = app.profiles as any

  async function handleApprove() {
    try {
      await review.mutateAsync({ applicationId: app.id, userId: app.user_id, status: 'approved' })
      toast.success(`${profile?.name ?? 'User'}'s application approved`)
    } catch { toast.error('Failed to approve') }
  }

  async function handleReject() {
    try {
      await review.mutateAsync({ applicationId: app.id, userId: app.user_id, status: 'rejected', adminNote: rejectNote })
      toast.success('Application rejected')
      setRejecting(false)
    } catch { toast.error('Failed to reject') }
  }

  return (
    <div className="py-4 border-b border-[#e4e7e5] last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-[#002c14]">{profile?.name ?? 'Unknown'}</p>
            <StatusPill status={app.status} />
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              app.policy_type === 'compact'
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-emerald-50 text-[#0f7a3d]'
            }`}>
              {app.policy_type === 'compact' ? 'Compact' : 'Capital Return'}
            </span>
          </div>
          <p className="text-xs text-[#4a5d54]">{profile?.email ?? ''}</p>
          <p className="text-xs text-[#7a8a82] mt-0.5">
            Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            {app.reviewed_at && ` · Reviewed ${new Date(app.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
          {app.admin_note && (
            <p className="text-xs text-[#9c2c2c] mt-1">Note: {app.admin_note}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-[#4a5d54] hover:text-[#002c14] px-2 py-1.5 rounded-lg hover:bg-[#f7f9f8] transition-colors"
          >
            {expanded ? <EyeOff size={12} /> : <Eye size={12} />}
            {expanded ? 'Hide' : 'Details'}
          </button>
          <button
            onClick={() => printApplicationPDF(app, profile?.name ?? '', profile?.email ?? '')}
            className="flex items-center gap-1 text-xs text-[#4a5d54] hover:text-[#002c14] px-2 py-1.5 rounded-lg hover:bg-[#f7f9f8] transition-colors"
          >
            <Download size={12} /> PDF
          </button>

          {app.status === 'submitted' && (
            <>
              <Button size="sm" className="gap-1" style={{ backgroundColor: '#003819', color: 'white' }}
                onClick={handleApprove} disabled={review.isPending}>
                {review.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Approve
              </Button>
              <Button size="sm" variant="ghost" className="gap-1"
                style={{ borderColor: '#9c2c2c', color: '#9c2c2c', backgroundColor: 'transparent' }}
                onClick={() => setRejecting(r => !r)} disabled={review.isPending}>
                <XCircle size={12} /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Reject note input */}
      {rejecting && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819]"
          />
          <Button size="sm" onClick={handleReject} disabled={review.isPending}
            style={{ backgroundColor: '#9c2c2c', color: 'white' }}>
            {review.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Confirm Reject'}
          </Button>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 rounded-2xl bg-[#f7f9f8] border border-[#e4e7e5] p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
          {[
            ['Gender', app.gender], ['Marital Status', app.marital_status],
            ['Date of Birth', app.date_of_birth], ['Nationality', app.nationality],
            ['Occupation', app.occupation], ['Phone', app.phone],
            ['Account Name', app.account_name], ['Account Number', app.account_number],
            ...(app.sort_code ? [['Sort Code / Swift', app.sort_code]] : []),
            ['Bank & Branch', app.bank_and_branch], ['Payout Frequency', app.payout_frequency],
            ['ID Details', app.id_details], ['Next of Kin', app.next_of_kin],
            ['NOK Contact', app.next_of_kin_contact], ['Payment Mode', app.payment_mode],
          ].map(([l, v]) => (
            <div key={l}>
              <span className="text-[#7a8a82]">{l}: </span>
              <span className="text-[#002c14] font-medium">{v || '—'}</span>
            </div>
          ))}
          {app.self_description && (
            <div className="col-span-full mt-2 pt-2 border-t border-[#e4e7e5]">
              <span className="text-[#7a8a82]">About: </span>
              <span className="text-[#002c14]">{app.self_description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminApplications() {
  const [tab, setTab] = useState<Tab>('all')
  const { data: apps, isLoading } = useAdminApplications(tab === 'all' ? undefined : tab)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Investor Applications</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#f7f9f8', border: '1px solid #e4e7e5' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              backgroundColor: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#002c14' : '#7a8a82',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
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
          ) : !apps || apps.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={32} className="mx-auto mb-3" style={{ color: '#7a8a82' }} />
              <p className="text-sm font-medium" style={{ color: '#002c14' }}>No applications found</p>
              <p className="text-xs mt-1" style={{ color: '#7a8a82' }}>
                {tab === 'all' ? 'No applications yet' : `No ${tab} applications`}
              </p>
            </div>
          ) : (
            <div>
              {apps.map((app: any) => <ApplicationRow key={app.id} app={app} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
