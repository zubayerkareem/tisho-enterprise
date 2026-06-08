import { Loader2, CreditCard, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAdminPayments, useMarkPaymentPaid } from '@/api/admin'

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function PaymentRow({ payment }: { payment: any }) {
  const markPaid = useMarkPaymentPaid()
  const profile = payment.profiles as any
  const investment = payment.investments as any

  const handleMarkPaid = async () => {
    try {
      await markPaid.mutateAsync(payment.id)
      toast.success('Payment marked as paid')
    } catch {
      toast.error('Failed to update payment')
    }
  }

  const isOverdue = new Date(payment.date) < new Date()

  return (
    <div className="flex items-center justify-between gap-3 py-3.5" style={{ borderBottom: '1px solid #e4e7e5' }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: '#002c14' }}>
            {profile?.name ?? 'Unknown'}
          </p>
          {isOverdue && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#fee2e2', color: '#9c2c2c' }}>
              Overdue
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#4a5d54' }}>
          {investment?.label ?? 'Investment'}
        </p>
        <p className="text-xs" style={{ color: '#7a8a82' }}>
          Due {new Date(payment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-semibold text-sm" style={{ color: '#003819' }}>
          {fmt(payment.amount_pence)}
        </span>
        <Button
          size="sm"
          onClick={handleMarkPaid}
          disabled={markPaid.isPending}
          className="gap-1"
          style={{ backgroundColor: '#003819', color: 'white' }}
        >
          {markPaid.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          Mark Paid
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-10 text-center">
      <CreditCard size={28} className="mx-auto mb-2" style={{ color: '#7a8a82' }} />
      <p className="text-sm" style={{ color: '#7a8a82' }}>{label}</p>
    </div>
  )
}

export function AdminPayments() {
  const { data: payments, isLoading } = useAdminPayments()

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const dueSoon = (payments ?? []).filter((p: any) => p.date >= today && p.date <= sevenDaysLater)
  const allPending = payments ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Payments</h1>
        <p className="text-sm" style={{ color: '#7a8a82' }}>
          {allPending.length} pending payment{allPending.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: '#7a8a82' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Due Soon */}
          <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#002c14' }}>
                Due Soon (7 days)
              </p>
              {dueSoon.length === 0 ? (
                <EmptyState label="No payments due in the next 7 days" />
              ) : (
                dueSoon.map((p: any) => <PaymentRow key={p.id} payment={p} />)
              )}
            </CardContent>
          </Card>

          {/* All Pending */}
          <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#002c14' }}>
                All Pending
              </p>
              {allPending.length === 0 ? (
                <EmptyState label="No pending payments" />
              ) : (
                allPending.map((p: any) => <PaymentRow key={p.id} payment={p} />)
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
