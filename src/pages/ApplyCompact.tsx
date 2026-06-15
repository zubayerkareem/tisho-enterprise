import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, Download, FileText, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth/AuthContext'
import { useMyApplication, useSubmitApplication } from '@/api/applications'
import { printApplicationPDF } from '@/lib/applicationPDF'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  gender: string; marital_status: string; date_of_birth: string
  nationality: string; occupation: string; postal_address: string
  physical_address: string; phone: string; fax: string; website: string
  account_name: string; account_number: string; sort_code: string; bank_and_branch: string
  payout_frequency: string
  id_details: string; next_of_kin: string; next_of_kin_contact: string
  facebook: string; twitter: string; other_social: string
  payment_mode: string
  self_description: string
}

const EMPTY: FormData = {
  gender: '', marital_status: '', date_of_birth: '', nationality: '',
  occupation: '', postal_address: '', physical_address: '', phone: '',
  fax: '', website: '', account_name: '', account_number: '', sort_code: '',
  bank_and_branch: '', payout_frequency: 'monthly', id_details: '',
  next_of_kin: '', next_of_kin_contact: '', facebook: '', twitter: '',
  other_social: '', payment_mode: 'Bank Transfer', self_description: '',
}

const STEPS = [
  { n: 1, label: 'Personal Info' },
  { n: 2, label: 'Bank Details' },
  { n: 3, label: 'Identity & KYC' },
  { n: 4, label: 'About You' },
  { n: 5, label: 'Review & Sign' },
]

// ─── Shared UI ────────────────────────────────────────────────────────────────

const iCls = 'w-full px-4 py-2.5 rounded-xl border border-[#e4e7e5] text-sm text-[#002c14] bg-white focus:outline-none focus:ring-2 focus:ring-[#003819] transition-all placeholder:text-[#c5cdc9]'

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#4a5d54] uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-[#9c2c2c] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-[#9c2c2c] mt-1 flex items-center gap-1">
          <Info size={11} />{error}
        </p>
      )}
    </div>
  )
}

function Sel({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={iCls + ' cursor-pointer'}>
      <option value="" disabled>Select…</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Pills({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
            value === o ? 'bg-[#003819] text-white border-[#003819]' : 'bg-white text-[#4a5d54] border-[#e4e7e5] hover:border-[#003819]'
          }`}>
          {o}
        </button>
      ))}
    </div>
  )
}

function ReviewRow({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#e4e7e5] last:border-0">
      <span className="text-xs text-[#7a8a82] w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#002c14] font-medium capitalize">{val || '—'}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ApplyCompact() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const submit = useSubmitApplication('compact')
  const { data: existing, isLoading: loadingExisting } = useMyApplication('compact')

  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState<FormData>(EMPTY)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'agreed', string>>>({})
  const [done, setDone]   = useState(false)
  const [reapplying, setReapplying] = useState(false)
  const [savedData, setSavedData] = useState<(FormData & { agreed_at: string; policy_type: string }) | null>(null)

  const name  = profile?.name  ?? ''
  const email = profile?.email ?? ''

  function set(k: keyof FormData, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: undefined }))
  }

  function validate(s: number) {
    const e: typeof errors = {}
    if (s === 1) {
      if (!form.gender)                     e.gender           = 'Required'
      if (!form.marital_status)             e.marital_status   = 'Required'
      if (!form.date_of_birth)              e.date_of_birth    = 'Required'
      if (!form.nationality.trim())         e.nationality      = 'Required'
      if (!form.occupation.trim())          e.occupation       = 'Required'
      if (!form.postal_address.trim())      e.postal_address   = 'Required'
      if (!form.physical_address.trim())    e.physical_address = 'Required'
      if (!form.phone.trim())               e.phone            = 'Required'
    } else if (s === 2) {
      if (!form.account_name.trim())        e.account_name    = 'Required'
      if (!form.account_number.trim())      e.account_number  = 'Required'
      if (!form.sort_code.trim())           e.sort_code       = 'Required'
      if (!form.bank_and_branch.trim())     e.bank_and_branch = 'Required'
    } else if (s === 3) {
      if (!form.id_details.trim())          e.id_details          = 'Required'
      if (!form.next_of_kin.trim())         e.next_of_kin         = 'Required'
      if (!form.next_of_kin_contact.trim()) e.next_of_kin_contact = 'Required'
      if (!form.payment_mode)               e.payment_mode        = 'Required'
    } else if (s === 4) {
      if (form.self_description.trim().length < 30) e.self_description = 'Please write at least 30 characters.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() { if (validate(step)) setStep(s => Math.min(s + 1, 5)) }
  function prev() { setStep(s => Math.max(s - 1, 1)) }

  async function handleSubmit() {
    if (!agreed) { setErrors(p => ({ ...p, agreed: 'You must agree to the Terms and Conditions.' })); return }
    const payload = { ...form, agreed_at: new Date().toISOString() }
    try {
      await submit.mutateAsync(payload)
      setSavedData({ ...payload, policy_type: 'compact' })
      setDone(true)
    } catch (err: any) {
      toast.error('Submission failed', { description: err.message })
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loadingExisting) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#7a8a82]" />
      </div>
    )
  }

  // ─── Already submitted / approved / rejected ───────────────────────────────
  if (existing && !done && !reapplying) {
    const colorMap: Record<string, string> = {
      approved: 'bg-[#c3f63c]',
      rejected: 'bg-red-100',
      submitted: 'bg-amber-50',
    }
    const msgMap: Record<string, string> = {
      approved: 'Your Compact Policy application has been approved.',
      rejected: `Your application was not approved.${existing.admin_note ? ` Reason: ${existing.admin_note}` : ' Contact support for more information.'}`,
      submitted: 'Your application is under review. We will notify you once a decision is made (1–2 business days).',
    }
    return (
      <div className="max-w-lg mx-auto py-8">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${colorMap[existing.status] ?? 'bg-[#f7f9f8]'}`}>
              <FileText size={28} className={existing.status === 'approved' ? 'text-[#003819]' : existing.status === 'rejected' ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-[#002c14] capitalize">
                  Application {existing.status === 'submitted' ? 'Under Review' : existing.status}
                </h2>
                <Badge variant={existing.status === 'approved' ? 'active' : existing.status === 'rejected' ? 'rejected' : 'pending'}>
                  {existing.status}
                </Badge>
              </div>
              <p className="text-sm text-[#7a8a82] leading-relaxed max-w-sm mx-auto">{msgMap[existing.status]}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant="secondary" className="gap-2"
                onClick={() => printApplicationPDF(existing, name, email)}>
                <Download size={14} /> Download PDF
              </Button>
              {existing.status === 'approved' && (
                <Button onClick={() => navigate('/investments')}>Go to Investments</Button>
              )}
              {existing.status === 'rejected' && (
                <>
                  <Button onClick={() => setReapplying(true)}>Re-apply</Button>
                  <Button variant="secondary" onClick={() => navigate('/support')}>Contact Support</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Success after submit ──────────────────────────────────────────────────
  if (done && savedData) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#c3f63c] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-[#003819]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#002c14]">Application Submitted!</h2>
              <p className="text-sm text-[#7a8a82] mt-2 leading-relaxed max-w-sm mx-auto">
                Your Compact Policy application has been received. Our team will review it within 1–2 business days.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant="secondary" className="gap-2"
                onClick={() => printApplicationPDF(savedData, name, email)}>
                <Download size={14} /> Download PDF
              </Button>
              <Button onClick={() => navigate('/settings')}>Back to Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Form wizard ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#002c14]">Apply for Compact Policy</h1>
        <p className="text-sm text-[#7a8a82] mt-1">Monthly returns of 10–14%. Complete all sections to apply. Required before making compact policy investments.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                s.n < step  ? 'bg-[#003819] text-white' :
                s.n === step ? 'bg-[#c3f63c] text-[#003819]' :
                'bg-[#e4e7e5] text-[#7a8a82]'
              }`}>
                {s.n < step ? <CheckCircle2 size={13} /> : s.n}
              </div>
              <span className="text-[10px] text-[#7a8a82] mt-0.5 hidden sm:block whitespace-nowrap">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 transition-colors ${s.n < step ? 'bg-[#003819]' : 'bg-[#e4e7e5]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <Card>
        <CardContent className="pt-6 pb-6">

          {/* ── Step 1: Personal ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#002c14]">Section A — Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input value={name} readOnly className={iCls + ' bg-[#f7f9f8] cursor-not-allowed opacity-70'} />
                </Field>
                <Field label="Email Address">
                  <input value={email} readOnly className={iCls + ' bg-[#f7f9f8] cursor-not-allowed opacity-70'} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Gender" required error={errors.gender}>
                  <Sel value={form.gender} onChange={v => set('gender', v)} opts={['Male', 'Female', 'Other', 'Prefer not to say']} />
                </Field>
                <Field label="Marital Status" required error={errors.marital_status}>
                  <Sel value={form.marital_status} onChange={v => set('marital_status', v)} opts={['Single', 'Married', 'Divorced', 'Widowed', 'Other']} />
                </Field>
                <Field label="Date of Birth" required error={errors.date_of_birth}>
                  <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={iCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nationality" required error={errors.nationality}>
                  <input value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. British" className={iCls} />
                </Field>
                <Field label="Occupation" required error={errors.occupation}>
                  <input value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="e.g. Software Engineer" className={iCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone Number" required error={errors.phone}>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 000000" className={iCls} />
                </Field>
                <Field label="Fax">
                  <input value={form.fax} onChange={e => set('fax', e.target.value)} placeholder="Optional" className={iCls} />
                </Field>
              </div>
              <Field label="Postal Address" required error={errors.postal_address}>
                <input value={form.postal_address} onChange={e => set('postal_address', e.target.value)} placeholder="P.O. Box or postal address" className={iCls} />
              </Field>
              <Field label="Physical Address" required error={errors.physical_address}>
                <input value={form.physical_address} onChange={e => set('physical_address', e.target.value)} placeholder="Street address, city, postcode" className={iCls} />
              </Field>
              <Field label="Website">
                <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yourwebsite.com (optional)" className={iCls} />
              </Field>
            </div>
          )}

          {/* ── Step 2: Bank ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#002c14]">Section B — Bank & Payout Details</h2>
              <p className="text-xs text-[#7a8a82]">Provide the bank account where your monthly investment returns will be sent.</p>
              <Field label="Account Name" required error={errors.account_name}>
                <input value={form.account_name} onChange={e => set('account_name', e.target.value)} placeholder="Name on bank account" className={iCls} />
              </Field>
              <Field label="Account Number" required error={errors.account_number}>
                <input value={form.account_number} onChange={e => set('account_number', e.target.value)} placeholder="e.g. 12345678" className={iCls} />
              </Field>
              <Field label="Sort Code / Swift Code" required error={errors.sort_code}>
                <input value={form.sort_code} onChange={e => set('sort_code', e.target.value)} placeholder="e.g. 20-00-00 or BARCGB22" className={iCls} />
              </Field>
              <Field label="Bank & Branch" required error={errors.bank_and_branch}>
                <input value={form.bank_and_branch} onChange={e => set('bank_and_branch', e.target.value)} placeholder="e.g. Barclays Bank, London" className={iCls} />
              </Field>
              <Field label="Payout Frequency" required>
                <Pills value={form.payout_frequency} onChange={v => set('payout_frequency', v)}
                  opts={['monthly', 'quarterly', 'bi-annually', 'annually']} />
              </Field>

              {/* Rate table */}
              <div className="rounded-2xl bg-[#f7f9f8] border border-[#e4e7e5] p-4 mt-2">
                <p className="text-xs font-semibold text-[#4a5d54] uppercase tracking-wider mb-3">Compact Policy Rates (Monthly) — Section F</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#e4e7e5]">
                      <th className="text-left pb-2 font-semibold text-[#7a8a82]">Capital (GBP)</th>
                      <th className="text-right pb-2 font-semibold text-[#7a8a82]">Monthly Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['£0 – £5,000',               '6%'],
                      ['£5,001 – £50,000',          '7%'],
                      ['£50,001 – £500,000',         '8%'],
                      ['£500,001 – £5,000,000',      '9%'],
                      ['Over £5,000,000',            '10%'],
                    ].map(([c, r]) => (
                      <tr key={c} className="border-b border-[#e4e7e5] last:border-0">
                        <td className="py-1.5 text-[#002c14]">{c}</td>
                        <td className="py-1.5 text-right font-bold text-[#0f7a3d]">{r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Step 3: KYC ──────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#002c14]">Section C/D — Identity & KYC</h2>
              <Field label="Valid Identification Details" required error={errors.id_details}>
                <input value={form.id_details} onChange={e => set('id_details', e.target.value)}
                  placeholder="e.g. Passport No. AB123456, issued UK, expires 2029" className={iCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Next of Kin" required error={errors.next_of_kin}>
                  <input value={form.next_of_kin} onChange={e => set('next_of_kin', e.target.value)} placeholder="Full name" className={iCls} />
                </Field>
                <Field label="Next of Kin Contact" required error={errors.next_of_kin_contact}>
                  <input value={form.next_of_kin_contact} onChange={e => set('next_of_kin_contact', e.target.value)} placeholder="Phone or email" className={iCls} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Facebook">
                  <input value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="Name or email" className={iCls} />
                </Field>
                <Field label="Twitter / X">
                  <input value={form.twitter} onChange={e => set('twitter', e.target.value)} placeholder="@handle" className={iCls} />
                </Field>
                <Field label="Other Social">
                  <input value={form.other_social} onChange={e => set('other_social', e.target.value)} placeholder="LinkedIn, etc." className={iCls} />
                </Field>
              </div>
              <Field label="Preferred Payment Mode (Section D)" required error={errors.payment_mode}>
                <Pills value={form.payment_mode} onChange={v => set('payment_mode', v)}
                  opts={['Bank Transfer', 'Cash', 'Western Union', 'MoneyGram']} />
              </Field>
            </div>
          )}

          {/* ── Step 4: About ─────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#002c14]">Section E — About You</h2>
              <p className="text-xs text-[#7a8a82]">Describe yourself — your background, investment goals, and why you want to invest with Tisho Enterprises.</p>
              <Field label="Self Description" required error={errors.self_description}>
                <textarea
                  value={form.self_description}
                  onChange={e => set('self_description', e.target.value)}
                  rows={9}
                  placeholder="Write about your professional background, investment experience, and what you hope to achieve..."
                  className={iCls + ' resize-none rounded-2xl'}
                />
                <p className="text-xs text-[#7a8a82] mt-1 text-right">{form.self_description.length} chars</p>
              </Field>
            </div>
          )}

          {/* ── Step 5: Review + T&C ─────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-[#002c14]">Review & Sign</h2>

              {[
                { title: 'Section A – Personal', rows: [
                  ['Name', name], ['Email', email], ['Gender', form.gender],
                  ['Marital Status', form.marital_status], ['Date of Birth', form.date_of_birth],
                  ['Nationality', form.nationality], ['Occupation', form.occupation],
                  ['Phone', form.phone], ['Postal Address', form.postal_address],
                  ['Physical Address', form.physical_address],
                ]},
                { title: 'Section B – Bank & Payout', rows: [
                  ['Account Name', form.account_name], ['Account Number', form.account_number],
                  ['Sort Code / Swift', form.sort_code], ['Bank & Branch', form.bank_and_branch],
                  ['Payout Frequency', form.payout_frequency],
                ]},
                { title: 'Section C/D – KYC & Payment', rows: [
                  ['ID Details', form.id_details], ['Next of Kin', form.next_of_kin],
                  ['NOK Contact', form.next_of_kin_contact], ['Payment Mode', form.payment_mode],
                ]},
              ].map(s => (
                <div key={s.title} className="rounded-2xl border border-[#e4e7e5] p-4">
                  <p className="text-xs font-semibold text-[#4a5d54] uppercase tracking-wider mb-2">{s.title}</p>
                  {s.rows.map(([l, v]) => <ReviewRow key={l} label={l} val={v} />)}
                </div>
              ))}

              {/* T&C */}
              <div className="rounded-2xl border border-[#e4e7e5] bg-[#f7f9f8] p-4">
                <p className="text-xs font-semibold text-[#002c14] uppercase tracking-wider mb-3">Terms and Conditions — Compact Policy</p>
                <ol className="space-y-2 text-xs text-[#4a5d54] list-decimal pl-4 leading-relaxed">
                  {[
                    'The investor enjoys between 6% and 10% per month in this policy, calculated on initial capital contributed for a maximum of 24 months. The contract is terminated at 24th month but the investor can re-invest or have as many investment policies as they wish.',
                    'Anyone who refers an investor that successfully invests is credited £100 to their referral balance as a one-time commission.',
                    'Monthly portfolio updates will be made available through the Tisho Enterprises platform and via registered email.',
                    'A unique investor reference number is issued to all investors upon application approval.',
                    'A transaction record is maintained for every return payment, accessible in the Payment History section of the platform.',
                    'Funds can only be returned to the registered bank account of the investor as stated in Section B.',
                    'Transfer fees are handled by Tisho Enterprises for all transactions.',
                    'All notifications and updates will be sent to the registered email address and platform inbox only.',
                    'Tisho Enterprises reserves the right to manage its compensation policy. Once this agreement is signed, it is legally binding and cannot be changed except by mutual agreement of both parties.',
                  ].map((t, i) => <li key={i}>{t}</li>)}
                </ol>
              </div>

              {/* Agreement */}
              <div className={`rounded-2xl border-2 p-4 transition-colors cursor-pointer ${agreed ? 'border-[#003819] bg-[#003819]/5' : 'border-[#e4e7e5]'}`}
                onClick={() => { setAgreed(a => !a); setErrors(p => ({ ...p, agreed: undefined })) }}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    agreed ? 'bg-[#003819] border-[#003819]' : 'border-[#c5cdc9] bg-white'
                  }`}>
                    {agreed && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-[#002c14] select-none">
                    I have read and agree to the Terms and Conditions above. I confirm that all information provided is accurate and complete.
                  </span>
                </div>
                {errors.agreed && <p className="text-xs text-[#9c2c2c] mt-2 pl-8 flex items-center gap-1"><Info size={11} />{errors.agreed}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nav buttons */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="secondary" onClick={prev} disabled={step === 1} className="gap-2">
          <ChevronLeft size={16} /> Previous
        </Button>
        {step < 5 ? (
          <Button onClick={next} className="gap-2">
            Next <ChevronRight size={16} />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submit.isPending} className="gap-2">
            {submit.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {submit.isPending ? 'Submitting…' : 'Submit Application'}
          </Button>
        )}
      </div>
    </div>
  )
}
