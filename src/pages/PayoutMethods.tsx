import { PlusCircle, Building2, Star, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { mockPayoutMethods } from '@/data/mockData'

function MethodCard({ method }) {
  return (
    <Card className={method.isPrimary ? 'ring-2 ring-[#003819]' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#f7f9f8] rounded-xl flex items-center justify-center shrink-0 border border-[#e4e7e5]">
              <Building2 size={18} className="text-[#4a5d54]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="font-semibold text-[#002c14] text-sm">{method.label}</p>
                {method.isPrimary && (
                  <span className="inline-flex items-center gap-1 bg-[#c3f63c] text-[#002c14] text-xs font-semibold px-2 py-0.5 rounded-full">
                    <Star size={9} /> Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-[#4a5d54]">{method.accountName}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#7a8a82] flex-wrap">
                <span>Account: {method.accountNumber}</span>
                <span>·</span>
                <span>Sort: {method.sortCode}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-2 rounded-full hover:bg-[#f7f9f8] text-[#4a5d54]" aria-label="Edit"><Pencil size={14} /></button>
            {!method.isPrimary && (
              <button className="p-2 rounded-full hover:bg-red-50 text-[#7a8a82] hover:text-[#9c2c2c]" aria-label="Remove"><Trash2 size={14} /></button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PayoutMethods() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#7a8a82]">{mockPayoutMethods.length} payout method(s)</p>
        <Button size="sm" className="gap-1.5">
          <PlusCircle size={14} /> <span className="hidden sm:inline">Add Bank Account</span><span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="space-y-3">
        {mockPayoutMethods.map(m => <MethodCard key={m.id} method={m} />)}
      </div>

      <Card className="bg-[#f7f9f8]">
        <CardContent className="pt-4 flex items-start gap-3">
          <ShieldCheck size={18} className="text-[#003819] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#002c14]">Bank details are stored securely</p>
            <p className="text-xs text-[#7a8a82] mt-0.5">Your payout account information is encrypted. Payments are processed via verified bank transfer only.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
