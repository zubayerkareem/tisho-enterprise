import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mockPayments } from '@/data/mockData'

export function PaymentHistory() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mockPayments
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => p.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalReceived = mockPayments
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Received', value: `£${totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, sub: 'All-time' },
          { label: 'This Year', value: '£14,650.00', sub: 'Jan–Jun 2025' },
          { label: 'Pending', value: `£${mockPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, sub: `${mockPayments.filter(p => p.status === 'pending').length} payment(s)` },
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>All Payments ({filtered.length})</CardTitle>
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
              </select>
              <Button variant="secondary" size="sm" className="gap-1.5 hidden sm:flex">
                <Download size={13} /> CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
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
                      <p className="text-xs text-[#7a8a82] font-normal">{p.id}</p>
                    </td>
                    <td className="py-3 pr-4 text-[#4a5d54] whitespace-nowrap text-sm">{p.method}</td>
                    <td className="py-3 pr-4 font-semibold text-[#002c14] whitespace-nowrap">
                      £{p.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3"><Badge variant={p.status}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-[#e4e7e5] last:border-0 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#002c14] truncate">{p.description.split('—')[1]?.trim() || p.description}</p>
                  <p className="text-xs text-[#7a8a82] mt-0.5">
                    {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.method}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#002c14]">£{p.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                  <Badge variant={p.status}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center py-10 text-sm text-[#7a8a82]">No payments match your filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
