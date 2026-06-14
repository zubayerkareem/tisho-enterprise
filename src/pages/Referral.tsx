import { useState } from 'react'
import { Copy, Check, Users, Gift, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/AuthContext'
import { useReferrals } from '@/api/referrals'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#003819] text-white text-xs font-medium hover:bg-[#004d24] transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function Referral() {
  const { profile } = useAuth()
  const { data: referrals, isLoading } = useReferrals()

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/signup?ref=${profile.referral_code}`
    : ''

  const balanceGbp = (profile?.referral_balance_pence ?? 0) / 100
  const totalReferrals = referrals?.length ?? 0
  const totalEarned = (referrals ?? []).reduce((sum, r) => sum + r.bonus_pence, 0) / 100

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Hero card */}
      <Card className="overflow-hidden border-0 bg-[#003819]">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#c3f63c] rounded-2xl flex items-center justify-center shrink-0">
              <Gift size={22} className="text-[#003819]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Refer & Earn £100</h2>
              <p className="text-[#abc6b7] text-sm mt-1 leading-relaxed">
                Share your referral link. Every time a friend invests using your link, you earn <strong className="text-[#c3f63c]">£100</strong> added instantly to your referral balance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Referral Balance', value: `£${balanceGbp.toFixed(2)}`, icon: Gift, green: true },
          { label: 'Friends Referred', value: isLoading ? '…' : String(totalReferrals), icon: Users, green: false },
          { label: 'Total Earned', value: `£${totalEarned.toFixed(2)}`, icon: TrendingUp, green: false },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} className={s.green ? 'text-[#0f7a3d]' : 'text-[#7a8a82]'} />
                <p className="text-xs text-[#7a8a82]">{s.label}</p>
              </div>
              <p className={`text-xl font-bold ${s.green ? 'text-[#0f7a3d]' : 'text-[#002c14]'}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral link */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm font-semibold text-[#002c14] mb-3">Your referral link</p>
          <div className="flex items-center gap-2 bg-[#f7f9f8] rounded-full px-4 py-2.5 border border-[#e4e7e5]">
            <span className="flex-1 text-sm text-[#4a5d54] truncate font-mono">{referralLink}</span>
            <CopyButton text={referralLink} />
          </div>
          <p className="text-xs text-[#7a8a82] mt-2 px-1">
            Share this link with friends. When they register, you automatically receive £100.
          </p>
        </CardContent>
      </Card>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on Tisho Enterprises and start investing! Use my link: ${referralLink}`)}`, '_blank')}
        >
          <span className="text-base leading-none">💬</span> Share on WhatsApp
        </Button>
        <CopyButton text={referralLink} />
      </div>

      {/* Referral history */}
      <section>
        <h2 className="text-xs font-semibold text-[#002c14] mb-3 uppercase tracking-wider">Referral History</h2>
        {isLoading ? (
          <Card><CardContent className="pt-8 pb-8 text-center text-sm text-[#7a8a82]">Loading…</CardContent></Card>
        ) : referrals && referrals.length > 0 ? (
          <Card>
            <CardContent className="pt-4 pb-2">
              <div className="divide-y divide-[#e4e7e5]">
                {referrals.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f7f9f8] border border-[#e4e7e5] flex items-center justify-center text-xs font-bold text-[#4a5d54]">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#002c14]">Friend signed up</p>
                        <p className="text-xs text-[#7a8a82]">
                          {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#0f7a3d]">+£{(r.bonus_pence / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <Users size={28} className="text-[#c5cdc9] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#002c14]">No referrals yet</p>
              <p className="text-xs text-[#7a8a82] mt-1">Share your link above to start earning.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
