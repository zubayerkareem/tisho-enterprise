import { User, Lock, Bell, FileCheck, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { mockUser } from '@/data/mockData'

function SectionCard({ icon: Icon, title, children }) {
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
  return (
    <div className="space-y-4 md:space-y-5 max-w-2xl">

      {/* Personal Info */}
      <SectionCard icon={User} title="Personal Information">
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#e4e7e5]">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-[#003819] flex items-center justify-center">
              <span className="text-white font-bold text-lg">AP</span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#c3f63c] rounded-full flex items-center justify-center" aria-label="Change photo">
              <Camera size={11} className="text-[#002c14]" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-[#002c14]">{mockUser.name}</p>
            <p className="text-sm text-[#7a8a82]">Investor since {new Date(mockUser.joinDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {[
            { label: 'Full Name',       value: mockUser.name },
            { label: 'Email Address',   value: mockUser.email },
            { label: 'Phone Number',    value: mockUser.phone },
            { label: 'Country',         value: mockUser.country },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-[#4a5d54] mb-1.5">{f.label}</label>
              <input
                type="text"
                defaultValue={f.value}
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
              <input type="password" defaultValue="••••••••••" className="w-full px-4 py-2.5 text-sm rounded-full border border-[#e4e7e5] text-[#002c14] focus:outline-none focus:ring-2 focus:ring-[#003819]" />
            </div>
          ))}
          <Button size="sm" className="mt-1">Update Password</Button>
        </div>
      </SectionCard>

      {/* KYC Status */}
      <SectionCard icon={FileCheck} title="KYC Verification">
        <div className="flex items-center justify-between p-3 md:p-4 bg-[#f7f9f8] rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <FileCheck size={16} className="text-[#0f7a3d]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#002c14]">KYC Verified</p>
              <p className="text-xs text-[#7a8a82]">Approved 28 Feb 2024</p>
            </div>
          </div>
          <Badge variant="approved">Approved</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {['Government ID (Front)', 'Government ID (Back)', 'Proof of Address'].map(doc => (
            <div key={doc} className="border border-[#e4e7e5] rounded-xl p-2.5 md:p-3 text-center">
              <div className="w-7 h-9 bg-[#f7f9f8] rounded-lg mx-auto mb-1.5 flex items-center justify-center">
                <FileCheck size={14} className="text-[#0f7a3d]" />
              </div>
              <p className="text-xs text-[#4a5d54] font-medium leading-tight">{doc}</p>
              <p className="text-xs text-[#0f7a3d] mt-0.5">Uploaded</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={Bell} title="Notification Preferences">
        <div className="space-y-0">
          {[
            { label: 'Monthly profit credited',    desc: 'Email on each return payment',       on: true },
            { label: 'Withdrawal status updates',  desc: 'Email on approval, rejection, payout', on: true },
            { label: 'Support message replies',    desc: 'Email when admin replies',            on: true },
            { label: 'KYC status changes',         desc: 'Email on KYC approval or rejection', on: false },
            { label: 'Investment confirmations',   desc: 'Email when investment is activated',  on: true },
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
