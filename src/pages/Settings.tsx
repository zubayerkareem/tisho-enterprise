import { useNavigate } from 'react-router-dom'
import { User, Lock, Bell, FileCheck, Camera, Download, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/auth/AuthContext'
import { useMyApplication } from '@/api/applications'
import { printApplicationPDF } from '@/lib/applicationPDF'

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="w-8 h-8 bg-[#f7f9f8] rounded-xl flex items-center justify-center border border-[#e4e7e5] shrink-0">
          <Icon size={15} className="text-[#003819]" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: application, isLoading: loadingApp } = useMyApplication()

  const name  = profile?.name  ?? ''
  const email = profile?.email ?? ''

  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="space-y-4 md:space-y-5 max-w-2xl">

      {/* Personal Info */}
      <SectionCard icon={User} title="Personal Information">
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#e4e7e5]">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-[#003819] flex items-center justify-center">
              <span className="text-white font-bold text-lg">{initials}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#c3f63c] rounded-full flex items-center justify-center" aria-label="Change photo">
              <Camera size={11} className="text-[#002c14]" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-[#002c14]">{name}</p>
            {joinDate && <p className="text-sm text-[#7a8a82]">Investor since {joinDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {[
            { label: 'Full Name',     value: name },
            { label: 'Email Address', value: email },
            { label: 'Phone Number',  value: profile?.phone ?? '' },
            { label: 'Country',       value: profile?.country ?? '' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">{f.label}</label>
              <input type="text" defaultValue={f.value}
                className="w-full px-4 py-2.5 text-sm rounded-full border border-[#e4e7e5] text-[#002c14] focus:outline-none focus:ring-2 focus:ring-[#003819]"
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button size="sm">Save Changes</Button>
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard icon={Lock} title="Change Password">
        <div className="space-y-3">
          {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
            <div key={label}>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">{label}</label>
              <input type="password" defaultValue="••••••••••"
                className="w-full px-4 py-2.5 text-sm rounded-full border border-[#e4e7e5] text-[#002c14] focus:outline-none focus:ring-2 focus:ring-[#003819]"
              />
            </div>
          ))}
          <Button size="sm" className="mt-1">Update Password</Button>
        </div>
      </SectionCard>

      {/* KYC / Application */}
      <SectionCard icon={FileCheck} title="KYC Verification">
        {loadingApp ? (
          <div className="h-20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#003819] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !application ? (
          /* No application yet */
          <div className="rounded-2xl border-2 border-dashed border-[#e4e7e5] p-6 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={22} className="text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-[#002c14] mb-1">KYC Not Submitted</p>
            <p className="text-xs text-[#7a8a82] mb-4 leading-relaxed">
              Complete your investor application to unlock investing. It takes about 5 minutes.
            </p>
            <Button size="sm" onClick={() => navigate('/apply')}>
              Complete Application
            </Button>
          </div>
        ) : application.status === 'submitted' ? (
          /* Under review */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#002c14]">Application Under Review</p>
                  <p className="text-xs text-amber-700">
                    Submitted {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
              <Badge variant="pending">pending</Badge>
            </div>
            <p className="text-xs text-[#7a8a82]">Our team will review your application within 1–2 business days and notify you by email.</p>
            <Button variant="secondary" size="sm" className="gap-2"
              onClick={() => printApplicationPDF(application, name, email)}>
              <Download size={13} /> Download PDF
            </Button>
          </div>
        ) : application.status === 'approved' ? (
          /* Approved */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-[#f0fdf4] rounded-xl border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-[#0f7a3d]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#002c14]">KYC Verified</p>
                  <p className="text-xs text-[#7a8a82]">
                    Approved {application.reviewed_at ? new Date(application.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
              <Badge variant="active">approved</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                ['Account Name',   application.account_name  ?? '—'],
                ['Account Number', application.account_number ?? '—'],
                ['Bank',          application.bank_and_branch ?? '—'],
              ].map(([l, v]) => (
                <div key={l} className="bg-[#f7f9f8] rounded-xl p-2.5 border border-[#e4e7e5]">
                  <p className="text-[#7a8a82] mb-0.5">{l}</p>
                  <p className="font-medium text-[#002c14] truncate">{v}</p>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="gap-2"
              onClick={() => printApplicationPDF(application, name, email)}>
              <Download size={13} /> Download PDF
            </Button>
          </div>
        ) : (
          /* Rejected */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#002c14]">Application Not Approved</p>
                  {application.admin_note && (
                    <p className="text-xs text-red-600 mt-0.5">Reason: {application.admin_note}</p>
                  )}
                </div>
              </div>
              <Badge variant="rejected">rejected</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate('/apply')}>Re-apply</Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/support')}>Contact Support</Button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={Bell} title="Notification Preferences">
        <div className="space-y-0">
          {[
            { label: 'Monthly profit credited',    desc: 'Email on each return payment',         on: true  },
            { label: 'Withdrawal status updates',  desc: 'Email on approval, rejection, payout',  on: true  },
            { label: 'Support message replies',    desc: 'Email when admin replies',              on: true  },
            { label: 'KYC status changes',         desc: 'Email on KYC approval or rejection',   on: false },
            { label: 'Investment confirmations',   desc: 'Email when investment is activated',    on: true  },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-3 border-b border-[#e4e7e5] last:border-0 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#002c14] truncate">{n.label}</p>
                <p className="text-xs text-[#7a8a82] hidden sm:block">{n.desc}</p>
              </div>
              <button
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${n.on ? 'bg-[#003819]' : 'bg-[#c5cdc9]'}`}
                role="switch" aria-checked={n.on}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${n.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
