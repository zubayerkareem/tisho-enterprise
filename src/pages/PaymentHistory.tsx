import { useState, useMemo } from 'react'
import { Download, Search, Loader2, CreditCard, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { usePayments } from '@/api/payments'
import { useInvestments } from '@/api/investments'

// ─── Unified activity entry ────────────────────────────────────────────────

type ActivityKind = 'payment' | 'investment'

interface ActivityEntry {
  id:           string
  date:         string
  label:        string
  sublabel:     string
  amount_pence: number
  status:       string
  kind:         ActivityKind
}

// ─── CSV export ─────────────────────────────────────────────────────────────

function exportCSV(rows: ActivityEntry[]) {
  const header = ['Date', 'Type', 'Description', 'Amount (GBP)', 'Status']
  const lines  = rows.map(r => [
    new Date(r.date).toLocaleDateString('en-GB'),
    r.kind === 'payment' ? 'Payment Received' : 'Investment Made',
    `"${r.label.replace(/"/g, '""')}"`,
    (r.amount_pence / 100).toFixed(2),
    r.status,
  ])
  const csv  = [header, ...lines].map(l => l.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Page ────────────────────────────────────────────────────────────────────

type TabFilter = 'all' | 'payment' | 'investment'

export function PaymentHistory() {
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<TabFilter>('all')
  const [statusFilter, setStatus] = useState('all')

  const { data: payments,    isLoading: loadingPay } = usePayments()
  const { data: investments, isLoading: loadingInv } = useInvestments()
  const isLoading = loadingPay || loadingInv

  const activity = useMemo<ActivityEntry[]>(() => {
    const payEntries: ActivityEntry[] = (payments ?? []).map(p => ({
      id:           p.id,
      date:         p.date,
      label:        p.description,
      sublabel:     p.method,
      amount_pence: p.amount_pence,
      status:       p.status,
      kind:         'payment',
    }))

    const invEntries: ActivityEntry[] = (investments ?? []).map(i => ({
      id:           i.id,
      date:         i.start_date,
      label:        i.label,
      sublabel:     `${i.type === 'comprehensive' ? 'Comprehensive' : 'Compact'} · ${i.months_total} months`,
      amount_pence: i.amount_pence,
      status:       i.status,
      kind:         'investment',
    }))

    return [...payEntries, ...invEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [payments, investments])

  const thisYear = new Date().getFullYear()

  const totalReceived   = (payments ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + p.amount_pence, 0) / 100
  const totalInvested   = (investments ?? []).reduce((s, i) => s + i.amount_pence, 0) / 100
  const pendingPayments = (payments ?? []).filter(p => p.status === 'pending')
  const pendingTotal    = pendingPayments.reduce((s, p) => s + p.amount_pence, 0) / 100
  const thisYearReceived = (payments ?? [])
    .filter(p => p.status === 'completed' && new Date(p.date).getFullYear() === thisYear)
    .reduce((s, p) => s + p.amount_pence, 0) / 100

  const filtered = activity
    .filter(e => tab === 'all'        || e.kind === tab)
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => e.label.toLowerCase().includes(search.toLowerCase()))

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all',        label: 'All Activity' },
    { key: 'payment',    label: 'Payments Received' },
    { key: 'investment', label: 'Investments Made' },
  ]

  return (
    <div className="space-y-4 md:space-y-5">

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Received',  value: `£${totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,   sub: 'All-time returns',        green: true  },
          { label: 'Total Invested',  value: `£${totalInvested.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,   sub: 'Principal committed',     green: false },
          { label: 'This Year',       value: `£${thisYearReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, sub: `Jan–Dec ${thisYear}`,    green: false },
          { label: 'Pending',         value: `£${pendingTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,    sub: `${pendingPayments.length} awaiting`, green: false },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-[#7a8a82] font-medium">{s.label}</p>
              <p className={`text-base md:text-xl font-bold mt-0.5 ${s.green ? 'text-[#0f7a3d]' : 'text-[#002c14]'}`}>{s.value}</p>
              <p className="text-xs text-[#7a8a82] mt-0.5 hidden sm:block">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity card */}
      <Card>
        <CardHeader className="pb-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-[#e4e7e5] -mx-6 px-6 mb-4 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-[#003819] text-[#002c14]'
                    : 'border-transparent text-[#7a8a82] hover:text-[#4a5d54]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">
              {isLoading ? 'Loading…' : `${filtered.length} entr${filtered.length !== 1 ? 'ies' : 'y'}`}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a82]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] w-36 sm:w-44"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatus(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-full border border-[#e4e7e5] focus:outline-none focus:ring-2 focus:ring-[#003819] text-[#4a5d54]"
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              {filtered.length > 0 && (
                <Button variant="secondary" size="sm" className="gap-1.5 hidden sm:flex" onClick={() => exportCSV(filtered)}>
                  <Download size={13} /> CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#7a8a82]" />
            </div>

          ) : activity.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard size={28} className="text-[#c5cdc9] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#002c14]">No activity yet</p>
              <p className="text-xs text-[#7a8a82] mt-1">Your investments and payment history will appear here.</p>
            </div>

          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e4e7e5]">
                      {['Date', 'Description', 'Type', 'Amount', 'Status'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-[#7a8a82] pb-3 pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => (
                      <tr key={`${e.kind}-${e.id}`} className="border-b border-[#e4e7e5] last:border-0 hover:bg-[#f7f9f8] transition-colors">
                        <td className="py-3 pr-4 text-[#4a5d54] whitespace-nowrap text-xs">
                          {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 pr-4 max-w-xs">
                          <p className="text-[#002c14] font-medium truncate">{e.label}</p>
                          <p className="text-xs text-[#7a8a82] font-normal">{e.sublabel}</p>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {e.kind === 'payment' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[#0f7a3d] font-medium">
                              <ArrowDownLeft size={12} /> Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-[#4a5d54] font-medium">
                              <ArrowUpRight size={12} /> Invested
                            </span>
                          )}
                        </td>
                        <td className={`py-3 pr-4 font-semibold whitespace-nowrap ${e.kind === 'payment' ? 'text-[#0f7a3d]' : 'text-[#002c14]'}`}>
                          {e.kind === 'payment' ? '+' : ''}£{(e.amount_pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3">
                          <Badge variant={e.status as any}>{e.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-[#e4e7e5]">
                {filtered.map(e => (
                  <div key={`${e.kind}-${e.id}`} className="flex items-center gap-3 py-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      e.kind === 'payment' ? 'bg-emerald-50' : 'bg-[#f7f9f8]'
                    }`}>
                      {e.kind === 'payment'
                        ? <ArrowDownLeft size={16} className="text-[#0f7a3d]" />
                        : <TrendingUp    size={16} className="text-[#4a5d54]" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#002c14] truncate">{e.label}</p>
                      <p className="text-xs text-[#7a8a82] mt-0.5">
                        {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{e.sublabel}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${e.kind === 'payment' ? 'text-[#0f7a3d]' : 'text-[#002c14]'}`}>
                        {e.kind === 'payment' ? '+' : ''}£{(e.amount_pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={e.status as any}>{e.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="text-center py-10 text-sm text-[#7a8a82]">No entries match your filters.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
