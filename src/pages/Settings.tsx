import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, FileCheck, Download, AlertCircle, CheckCircle2, Clock, Loader2, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/auth/AuthContext'
import { useMyApplication } from '@/api/applications'
import { printApplicationPDF } from '@/lib/applicationPDF'
import { useUpdateProfile, useChangePassword } from '@/api/profile'

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
  const { profile } = useAuth()
  const { data: capitalApp, isLoading: loadingCapital } = useMyApplication('capital_return')
  const { data: compactApp,  isLoading: loadingCompact  } = useMyApplication('compact')

  const name  = profile?.name  ?? ''
  const email = profile?.email ?? ''

  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : ''

  // ── Personal Info ──────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name:    name,
    phone:   profile?.phone   ?? '',
    country: profile?.country ?? '',
  })
  const updateProfile = useUpdateProfile()

  function handleProfileChange(field: keyof typeof profileForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfileForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    updateProfile.mutate({
      name:    profileForm.name.trim()    || undefined,
      phone:   profileForm.phone.trim()   || undefined,
      country: profileForm.country.trim() || undefined,
    })
  }

  // ── Change Password ────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwError, setPwError] = useState('')
  const changePassword = useChangePassword()

  function handlePwChange(field: keyof typeof pwForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setPwError('')
      setPwForm(prev => ({ ...prev, [field]: e.target.value }))
    }
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    changePassword.mutate({ password: pwForm.next }, {
      onSuccess: () => setPwForm({ current: '', next: '', confirm: '' }),
    })
  }

  const inputClass = 'w-full px-4 py-2.5 text-sm rounded-full border border-[#e4e7e5] text-[#002c14] focus:outline-none focus:ring-2 focus:ring-[#003819]'

  return (
    <div className="space-y-4 md:space-y-5 max-w-2xl">

      {/* Personal Info */}
      <SectionCard icon={User} title="Personal Information">
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#e4e7e5]">
          <div className="w-14 h-14 rounded-full bg-[#003819] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-[#002c14]">{name}</p>
            {joinDate && <p className="text-sm text-[#7a8a82]">Investor since {joinDate}</p>}
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={handleProfileChange('name')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Email Address</label>
              <input
                type="text"
                value={email}
                disabled
                className={inputClass + ' opacity-50 cursor-not-allowed'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={handleProfileChange('phone')}
                placeholder="+44 7700 000000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">Country</label>
              <input
                type="text"
                value={profileForm.country}
                onChange={handleProfileChange('country')}
                placeholder="United Kingdom"
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button size="sm" type="submit" disabled={updateProfile.isPending} className="gap-2">
              {updateProfile.isPending && <Loader2 size={13} className="animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Change Password */}
      <SectionCard icon={Lock} title="Change Password">
        <form onSubmit={handleSavePassword} className="space-y-3">
          {(
            [
              { field: 'current' as const, label: 'Current Password' },
              { field: 'next'    as const, label: 'New Password' },
              { field: 'confirm' as const, label: 'Confirm New Password' },
            ]
          ).map(({ field, label }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPw[field] ? 'text' : 'password'}
                  value={pwForm[field]}
                  onChange={handlePwChange(field)}
                  placeholder="••••••••••"
                  className={inputClass + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(prev => ({ ...prev, [field]: !prev[field] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8a82] hover:text-[#002c14] transition-colors"
                >
                  {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          {pwError && (
            <p className="text-xs text-[#9c2c2c] flex items-center gap-1">
              <AlertCircle size={12} />{pwError}
            </p>
          )}
          <Button size="sm" type="submit" disabled={changePassword.isPending} className="mt-1 gap-2">
            {changePassword.isPending && <Loader2 size={13} className="animate-spin" />}
            Update Password
          </Button>
        </form>
      </SectionCard>

      {/* KYC / Applications */}
      <SectionCard icon={FileCheck} title="KYC Verification">
        <div className="space-y-3">
          <p className="text-xs text-[#7a8a82] leading-relaxed">
            Apply for a policy to become a verified investor. Each policy has its own application.
          </p>

          <ApplicationStatus
            label="Comprehensive Policy"
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
