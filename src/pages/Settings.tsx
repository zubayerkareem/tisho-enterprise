import { useNavigate } from 'react-router-dom'
import { User, Lock, FileCheck, Camera, Download, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
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

function ApplicationStatus({
  label, route, policyType, application, loading, name, email,
}: {
  label: string
  route: string
  policyType: 'capital_return' | 'compact'
  application: any
  loading: boolean
  name: string
  email: string
}) {
  const navigate = useNavigate()
  if (loading) return (
    <div className="h-14 flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-[#003819] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!application) return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-dashed border-[#e4e7e5]">
      <div>
        <p className="text-sm font-medium text-[#002c14]">{label}</p>
        <p className="text-xs text-[#7a8a82] mt-0.5">Not submitted</p>
      </div>
      <Button size="sm" onClick={() => navigate(route)}>Apply</Button>
    </div>
  )

  const statusColor = {
    approved: { bg: 'bg-[#f0fdf4] border-emerald-200', icon: 'text-[#0f7a3d]', iconBg: 'bg-emerald-100', IconEl: CheckCircle2 },
    submitted: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', iconBg: 'bg-amber-100', IconEl: Clock },
    rejected:  { bg: 'bg-red-50 border-red-200',     icon: 'text-red-600',    iconBg: 'bg-red-100',    IconEl: AlertCircle },
  }[application.status] ?? { bg: 'bg-[#f7f9f8] border-[#e4e7e5]', icon: 'text-[#7a8a82]', iconBg: 'bg-[#e4e7e5]', IconEl: Clock }

  const { IconEl } = statusColor

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${statusColor.bg}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${statusColor.iconBg}`}>
          <IconEl size={15} className={statusColor.icon} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#002c14]">{label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={application.status === 'approved' ? 'active' : application.status === 'rejected' ? 'rejected' : 'pending'}>
              {application.status}
            </Badge>
            {application.reviewed_at && (
              <span className="text-xs text-[#7a8a82]">
                {new Date(application.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          {application.admin_note && (
            <p className="text-xs text-[#9c2c2c] mt-0.5 truncate">Reason: {application.admin_note}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => printApplicationPDF({ ...application, policy_type: policyType }, name, email)}
          className="p-1.5 rounded-lg hover:bg-white/60 text-[#4a5d54] hover:text-[#002c14] transition-colors"
          title="Download PDF"
        >
          <Download size={13} />
        </button>
        {application.status === 'rejected' && (
          <Button size="sm" onClick={() => navigate(route)}>Re-apply</Button>
        )}
      </div>
    </div>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: capitalApp, isLoading: loadingCapital } = useMyApplication('capital_return')
  const { data: compactApp,  isLoading: loadingCompact  } = useMyApplication('compact')

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

      {/* KYC / Applications */}
      <SectionCard icon={FileCheck} title="KYC Verification">
        <div className="space-y-3">
          <p className="text-xs text-[#7a8a82] leading-relaxed">
            Apply for a policy to become a verified investor. Each policy has its own application.
          </p>

          <ApplicationStatus
            label="Capital Return Policy"
            route="/apply"
            policyType="capital_return"
            application={capitalApp}
            loading={loadingCapital}
            name={name}
            email={email}
          />

          <ApplicationStatus
            label="Compact Policy"
            route="/apply-compact"
            policyType="compact"
            application={compactApp}
            loading={loadingCompact}
            name={name}
            email={email}
          />
        </div>
      </SectionCard>

    </div>
  )
}
