import { Loader2, Gift, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { useAdminReferrals } from '@/api/admin'

function fmt(pence: number) {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function AdminReferrals() {
  const { data: referrals, isLoading } = useAdminReferrals()

  const totalBonusPence = (referrals ?? []).reduce((s: number, r: any) => s + (r.bonus_pence ?? 0), 0)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: '#002c14' }}>Referrals</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a5d54' }}>
              Total Referrals
            </p>
            <p className="text-2xl font-bold" style={{ color: '#002c14' }}>{referrals?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a5d54' }}>
              Total Bonuses
            </p>
            <p className="text-2xl font-bold" style={{ color: '#002c14' }}>{fmt(totalBonusPence)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-2xl">
        <CardContent className="pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#002c14' }}>
            All Referrals
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: '#7a8a82' }} />
            </div>
          ) : !referrals || referrals.length === 0 ? (
            <div className="py-12 text-center">
              <Gift size={32} className="mx-auto mb-3" style={{ color: '#7a8a82' }} />
              <p className="text-sm font-medium" style={{ color: '#002c14' }}>No referrals yet</p>
              <p className="text-xs mt-1" style={{ color: '#7a8a82' }}>Referrals will appear here once investors refer others.</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div
                className="hidden sm:grid grid-cols-4 gap-4 pb-2 mb-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#7a8a82', borderBottom: '1px solid #e4e7e5' }}
              >
                <span>Referrer</span>
                <span></span>
                <span>Referred</span>
                <span className="text-right">Bonus · Date</span>
              </div>

              {referrals.map((r: any) => (
                <div
                  key={r.id}
                  className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4 py-3.5"
                  style={{ borderBottom: '1px solid #e4e7e5' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#002c14' }}>
                      {r.referrer?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#7a8a82' }}>{r.referrer?.email}</p>
                  </div>

                  <div className="hidden sm:flex justify-center">
                    <ArrowRight size={14} style={{ color: '#7a8a82' }} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#002c14' }}>
                      {r.referred?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#7a8a82' }}>{r.referred?.email}</p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm font-semibold" style={{ color: '#003819' }}>{fmt(r.bonus_pence)}</p>
                    <p className="text-xs" style={{ color: '#7a8a82' }}>
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
