import { useState } from 'react'
import { Download, Search, Loader2, CreditCard } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { usePayments } from '@/api/payments'

function exportCSV(rows: NonNullable<ReturnType<typeof usePayments>['data']>) {
  const header = ['Date', 'Description', 'Method', 'Amount (GBP)', 'Status']
  const lines = rows.map(p => [
    new Date(p.date).toLocaleDateString('en-GB'),
    `"${p.description.replace(/"/g, '""')}"`,
    p.method,
    (p.amount_pence / 100).toFixed(2),
    p.status,
  ])
  const csv = [header, ...lines].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function PaymentHistory() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: payments, isLoading } = usePayments()
  const all = payments ?? []

  const thisYear = new Date().getFullYear()

  const totalReceived = all
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + p.amount_pence, 0) / 100

  const thisYearReceived = all
    .filter(p => p.status === 'completed' && new Date(p.date).getFullYear() === thisYear)
    .reduce((s, p) => s + p.amount_pence, 0) / 100

  const pendingPayments = all.filter(p => p.status === 'pending')
  const pendingTotal    = pendingPayments.reduce((s, p) => s + p.amount_pence, 0) / 100

  const filtered = all
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => p.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Total Received',
            value: `£${totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
            sub: 'All-time',
          },
          {
            label: 'This Year',
            value: `£${thisYearReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
            sub: `Jan–Dec ${thisYear}`,
          },
          {
            label: 'Pending',
            value: `£${pendingTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
            sub: `${pendingPayments.length} payment${pendingPayments.length !== 1 ? 's' : ''}`,
          },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-[#7a8a82] font-medium">{s.label}</p>
              <p className="text-base md:text-xl font-bold text-[#002c14] mt-0.5">{s.value}</p>
              <p className="text-xs text-[#7a8a82] mt-0.5 hidden sm:block">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>
              All Payments {!isLoading && `(${filtered.length})`}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a82]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] w-36 sm:w-44"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] text-[#4a5d54]"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              {all.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 hidden sm:flex"
                  onClick={() => exportCSV(filtered)}
                >
                  <Download size={13} /> CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#7a8a82]" />
            </div>
          ) : all.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard size={28} className="text-[#c5cdc9] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#002c14]">No payments yet</p>
              <p className="text-xs text-[#7a8a82] mt-1">Payments will appear here once your investments are active.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e4e7e5]">
                      {['Date', 'Description', 'Method', 'Amount', 'Status'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-[#7a8a82] pb-3 pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-[#e4e7e5] last:border-0 hover:bg-[#f7f9f8] transition-colors">
                        <td className="py-3 pr-4 text-[#4a5d54] whitespace-nowrap text-xs">
                          {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 pr-4 text-[#002c14] font-medium max-w-xs">
                          <p className="truncate">{p.description}</p>
                          <p className="text-xs text-[#7a8a82] font-normal font-mono">{p.id.slice(0, 8)}…</p>
                        </td>
                        <td className="py-3 pr-4 text-[#4a5d54] whitespace-nowrap text-sm">{p.method}</td>
                        <td className="py-3 pr-4 font-semibold text-[#002c14] whitespace-nowrap">
                          £{(p.amount_pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3">
                          <Badge variant={p.status as any}>{p.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-0">
                {filtered.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-[#e4e7e5] last:border-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#002c14] truncate">
                        {p.description.split('—')[1]?.trim() || p.description}
                      </p>
                      <p className="text-xs text-[#7a8a82] mt-0.5">
                        {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{p.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#002c14]">
                        £{(p.amount_pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={p.status as any}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="text-center py-10 text-sm text-[#7a8a82]">No payments match your filters.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
