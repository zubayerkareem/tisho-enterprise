import * as React from 'react'
import { useState, useRef, useCallback } from 'react'
import { X, ImageIcon, CheckCircle2, Info, Loader2, Landmark, CreditCard, Copy, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { compactTierRate, comprehensiveTierRate } from '@/lib/investments'
import { useCreateInvestment, useCreateStripeInvestment } from '@/api/investments'
import { toast } from 'sonner'
import type { InvestmentType, PayoutFrequency } from '@/types/models'

type PaymentMethod = 'bank' | 'stripe'

interface FormState {
  policy: InvestmentType | ''
  amount: string
  payoutFrequency: PayoutFrequency
  paymentMethod: PaymentMethod | ''
  screenshot: File | null
  screenshotPreview: string | null
}

interface AddInvestmentModalProps {
  open: boolean
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcReturns(policy: InvestmentType | '', amount: number) {
  if (!policy || !amount || amount <= 0) return null

  if (policy === 'comprehensive') {
    const rate = comprehensiveTierRate(amount)
    const monthly = (amount * rate / 100) / 12
    return { rate: `${rate}% per year`, monthly, total: monthly * 24, principalBack: true, tierNote: null }
  }

  const rate = compactTierRate(amount)
  const monthly = (amount * rate) / 100
  return {
    rate: `${rate}% per month`,
    monthly,
    total: monthly * 24,
    principalBack: false,
    tierNote: null,
  }
}

function fmt(n: number) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PolicyCard({ type, selected, onSelect }: { type: InvestmentType; selected: boolean; onSelect: () => void }) {
  const isComprehensive = type === 'comprehensive'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003819]',
        selected ? 'border-[#003819] bg-[#003819]' : 'border-[#e4e7e5] bg-white hover:border-[#c5cdc9]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-[#002c14]')}>
          {isComprehensive ? 'Comprehensive Policy' : 'Compact Policy'}
        </span>
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
          selected ? 'bg-[#c3f63c] text-[#002c14]'
            : isComprehensive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        )}>
          {isComprehensive ? '10–25% / year' : '6–10% / month'}
        </span>
      </div>
      <p className={cn('text-xs leading-relaxed', selected ? 'text-[#abc6b7]' : 'text-[#7a8a82]')}>
        {isComprehensive
          ? '24-month term · Monthly, quarterly, or annual payouts · Full principal returned at end'
          : '24-month term · Monthly payouts · Tiered rate by investment size · Principal absorbed into payout'}
      </p>
    </button>
  )
}

function PaymentMethodCard({
  method, selected, onSelect,
}: { method: PaymentMethod; selected: boolean; onSelect: () => void }) {
  const isBank = method === 'bank'
  const Icon = isBank ? Landmark : CreditCard
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003819]',
        selected ? 'border-[#003819] bg-[#003819]' : 'border-[#e4e7e5] bg-white hover:border-[#c5cdc9]'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          selected ? 'bg-white/15' : 'bg-[#f7f9f8]'
        )}>
          <Icon size={18} className={selected ? 'text-[#c3f63c]' : 'text-[#4a5d54]'} />
        </div>
        <div>
          <p className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-[#002c14]')}>
            {isBank ? 'Bank Transfer' : 'Pay with Stripe'}
          </p>
          <p className={cn('text-xs mt-0.5', selected ? 'text-[#abc6b7]' : 'text-[#7a8a82]')}>
            {isBank
              ? 'Transfer funds manually · Upload proof of payment'
              : 'Pay securely by card · Instant confirmation'}
          </p>
        </div>
      </div>
    </button>
  )
}

function DropZone({ file, preview, onFile, onClear }: {
  file: File | null; preview: string | null; onFile: (f: File) => void; onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('image/')) onFile(dropped)
  }, [onFile])

  if (file && preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-[#e4e7e5]">
        <img src={preview} alt="Bank transfer screenshot" className="w-full max-h-56 object-contain bg-[#f7f9f8]" />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm border border-[#e4e7e5] transition-colors"
          aria-label="Remove screenshot"
        >
          <X size={14} className="text-[#4a5d54]" />
        </button>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-[#e4e7e5]">
          <CheckCircle2 size={14} className="text-[#0f7a3d] shrink-0" />
          <span className="text-xs text-[#4a5d54] truncate">{file.name}</span>
          <span className="text-xs text-[#7a8a82] shrink-0 ml-auto">{(file.size / 1024).toFixed(0)} KB</span>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150',
        dragging ? 'border-[#003819] bg-[#003819]/5' : 'border-[#c5cdc9] hover:border-[#003819] hover:bg-[#f7f9f8]'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 bg-[#f7f9f8] rounded-xl flex items-center justify-center border border-[#e4e7e5]">
          <ImageIcon size={20} className="text-[#7a8a82]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#002c14]">
            {dragging ? 'Drop your screenshot here' : 'Upload bank transfer screenshot'}
          </p>
          <p className="text-xs text-[#7a8a82] mt-0.5">Drag & drop or click to browse · PNG, JPG, WebP</p>
        </div>
      </div>
    </div>
  )
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* ignore */ }
  }
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <span className="text-white font-medium text-xs text-right">{value}</span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${value}`}
        className="shrink-0 p-1 rounded-md hover:bg-white/15 text-[#abc6b7] hover:text-white transition-colors"
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  )
}

function BankRow({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[#abc6b7] text-xs shrink-0 pt-0.5">{label}</span>
      <CopyField value={val} />
    </div>
  )
}

function ReturnPreview({ policy, amount }: { policy: InvestmentType | ''; amount: number }) {
  const r = calcReturns(policy, amount)
  if (!r) return null

  return (
    <div className="rounded-2xl bg-[#f7f9f8] border border-[#e4e7e5] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#c3f63c]" />
        <p className="text-xs font-semibold text-[#4a5d54] uppercase tracking-wider">Estimated Returns</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Rate', val: r.rate },
          { label: 'Monthly return', val: `£${fmt(r.monthly)}` },
          { label: 'Total over 24mo', val: `£${fmt(r.total)}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-2.5 border border-[#e4e7e5]">
            <p className="text-xs text-[#7a8a82] mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-[#002c14] truncate">{s.val}</p>
          </div>
        ))}
      </div>
      {r.principalBack && (
        <p className="text-xs text-[#0f7a3d] flex items-center gap-1.5">
          <CheckCircle2 size={12} />
          Your £{fmt(amount)} principal is returned in full at month 24.
        </p>
      )}
      {r.tierNote && (
        <p className="text-xs text-[#b87333] flex items-center gap-1.5">
          <Info size={12} className="shrink-0" />{r.tierNote}
        </p>
      )}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AddInvestmentModal({ open, onClose }: AddInvestmentModalProps) {
  const createBankInvestment   = useCreateInvestment()
  const createStripeInvestment = useCreateStripeInvestment()

  const isPending = createBankInvestment.isPending || createStripeInvestment.isPending

  const [form, setForm] = useState<FormState>({
    policy: '',
    amount: '',
    payoutFrequency: 'monthly',
    paymentMethod: '',
    screenshot: null,
    screenshotPreview: null,
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const amountNum = parseFloat(form.amount.replace(/,/g, '')) || 0

  function handleFile(f: File) {
    const url = URL.createObjectURL(f)
    setForm(p => ({ ...p, screenshot: f, screenshotPreview: url }))
    setErrors(p => ({ ...p, screenshot: undefined }))
  }

  function clearFile() {
    if (form.screenshotPreview) URL.revokeObjectURL(form.screenshotPreview)
    setForm(p => ({ ...p, screenshot: null, screenshotPreview: null }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.policy) e.policy = 'Please select a policy.'
    if (!form.amount || amountNum <= 0) e.amount = 'Please enter a valid amount.'
    else if (amountNum < 0.20) e.amount = 'Minimum investment is £0.20.'
    if (!form.paymentMethod) e.paymentMethod = 'Please select a payment method.'
    if (form.paymentMethod === 'bank' && !form.screenshot) {
      e.screenshot = 'Please upload your bank transfer screenshot.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    try {
      if (form.paymentMethod === 'bank') {
        await createBankInvestment.mutateAsync({
          type: form.policy as InvestmentType,
          amountGbp: amountNum,
          months: 24,
          screenshotFile: form.screenshot!,
        })
        setSubmitted(true)
      } else {
        // Stripe: create investment then redirect
        const checkoutUrl = await createStripeInvestment.mutateAsync({
          type: form.policy as InvestmentType,
          amountGbp: amountNum,
          months: 24,
        })
        window.location.href = checkoutUrl
      }
    } catch (err: any) {
      toast.error('Submission failed', { description: err.message })
    }
  }

  function handleClose() {
    setSubmitted(false)
    setForm({ policy: '', amount: '', payoutFrequency: 'monthly', paymentMethod: '', screenshot: null, screenshotPreview: null })
    setErrors({})
    onClose()
  }

  // Step numbering shifts when payout frequency is shown
  const hasFrequencyStep = form.policy === 'comprehensive'
  const paymentStep  = hasFrequencyStep ? 4 : 3
  const screenshotStep = paymentStep + 1

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {submitted ? (
          <div className="flex flex-col items-center text-center px-8 py-12 gap-4">
            <div className="w-16 h-16 bg-[#c3f63c] rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-[#003819]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002c14]">Investment Request Submitted</h2>
              <p className="text-sm text-[#7a8a82] mt-2 leading-relaxed">
                Your {form.policy === 'comprehensive' ? 'Comprehensive' : 'Compact'} Policy investment of{' '}
                <strong className="text-[#002c14]">£{fmt(amountNum)}</strong> has been submitted for review.
                Our team will verify your bank transfer and activate your investment within 1–2 business days.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2 w-full sm:w-auto">Back to Investments</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#e4e7e5]">
              <DialogHeader>
                <DialogTitle>Add New Investment</DialogTitle>
                <DialogDescription>
                  Select your policy, enter the amount, choose how to pay, and submit.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Step 1 — Policy */}
              <section>
                <label className="block text-sm font-semibold text-[#002c14] mb-3">1. Select Policy</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['comprehensive', 'compact'] as InvestmentType[]).map(t => (
                    <PolicyCard
                      key={t}
                      type={t}
                      selected={form.policy === t}
                      onSelect={() => {
                        setForm(p => ({ ...p, policy: t }))
                        setErrors(p => ({ ...p, policy: undefined }))
                      }}
                    />
                  ))}
                </div>
                {errors.policy && (
                  <p className="text-xs text-[#9c2c2c] mt-1.5 flex items-center gap-1">
                    <Info size={11} />{errors.policy}
                  </p>
                )}
              </section>

              {/* Step 2 — Amount */}
              <section>
                <label className="block text-sm font-semibold text-[#002c14] mb-3" htmlFor="amount">
                  2. Investment Amount (£)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a5d54] font-semibold text-sm">£</span>
                  <input
                    id="amount"
                    type="number"
                    min="0.20"
                    step="0.01"
                    placeholder="e.g. 10000"
                    value={form.amount}
                    onChange={e => {
                      setForm(p => ({ ...p, amount: e.target.value }))
                      setErrors(p => ({ ...p, amount: undefined }))
                    }}
                    className={cn(
                      'w-full pl-8 pr-4 py-3 rounded-full border text-sm text-[#002c14] focus:outline-none focus:ring-2 focus:ring-[#003819] transition-all',
                      errors.amount ? 'border-[#9c2c2c] focus:ring-[#9c2c2c]' : 'border-[#e4e7e5]'
                    )}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-[#9c2c2c] mt-1.5 flex items-center gap-1">
                    <Info size={11} />{errors.amount}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[1000, 5000, 10000, 25000, 50000].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setForm(p => ({ ...p, amount: String(v) }))
                        setErrors(p => ({ ...p, amount: undefined }))
                      }}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        form.amount === String(v)
                          ? 'bg-[#003819] text-white border-[#003819]'
                          : 'bg-white text-[#4a5d54] border-[#e4e7e5] hover:border-[#003819] hover:text-[#003819]'
                      )}
                    >
                      £{v.toLocaleString('en-GB')}
                    </button>
                  ))}
                </div>
              </section>

              {/* Step 3 — Payout frequency (comprehensive only) */}
              {hasFrequencyStep && (
                <section>
                  <label className="block text-sm font-semibold text-[#002c14] mb-3">3. Payout Frequency</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['monthly', 'quarterly', 'annual'] as PayoutFrequency[]).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, payoutFrequency: f }))}
                        className={cn(
                          'py-2.5 rounded-full text-sm font-medium border transition-colors capitalize',
                          form.payoutFrequency === f
                            ? 'bg-[#003819] text-white border-[#003819]'
                            : 'bg-white text-[#4a5d54] border-[#e4e7e5] hover:border-[#003819]'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Return preview */}
              {form.policy && amountNum >= 500 && (
                <ReturnPreview policy={form.policy} amount={amountNum} />
              )}

              {/* Payment method */}
              <section>
                <label className="block text-sm font-semibold text-[#002c14] mb-3">
                  {paymentStep}. Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['bank', 'stripe'] as PaymentMethod[]).map(m => (
                    <PaymentMethodCard
                      key={m}
                      method={m}
                      selected={form.paymentMethod === m}
                      onSelect={() => {
                        setForm(p => ({ ...p, paymentMethod: m }))
                        setErrors(p => ({ ...p, paymentMethod: undefined }))
                      }}
                    />
                  ))}
                </div>
                {errors.paymentMethod && (
                  <p className="text-xs text-[#9c2c2c] mt-1.5 flex items-center gap-1">
                    <Info size={11} />{errors.paymentMethod}
                  </p>
                )}
              </section>

              {/* Bank path: bank details + screenshot */}
              {form.paymentMethod === 'bank' && (
                <section>
                  <label className="block text-sm font-semibold text-[#002c14] mb-1.5">
                    {screenshotStep}. Bank Transfer Screenshot
                  </label>
                  <p className="text-xs text-[#7a8a82] mb-3">
                    Transfer the funds to our account below, then upload a screenshot of the confirmed transfer.
                  </p>
                  <div className="bg-[#003819] rounded-2xl p-4 mb-4 text-sm space-y-3">
                    {/* UK / Domestic */}
                    <div className="space-y-1.5">
                      <p className="text-[#abc6b7] text-xs font-semibold uppercase tracking-wider">UK Bank Transfer</p>
                      {[
                        { label: 'Account Type',   val: 'Business' },
                        { label: 'Account Name',   val: 'TISHO ENTERPRISES LTD' },
                        { label: 'Sort Code',      val: '23-11-85' },
                        { label: 'Account Number', val: '49171401' },
                        { label: 'Reference',      val: `INV-${Date.now().toString().slice(-6)}` },
                        { label: 'Institution',    val: 'Payrnet' },
                        { label: 'Address',        val: '86-90 Paul Street, London, EC2A 4NE' },
                        { label: 'Inst. Address',  val: 'Po Box 1130, Cardiff, CF11 1WF' },
                      ].map(r => (
                        <BankRow key={r.label} label={r.label} val={r.val} />
                      ))}
                    </div>

                    <div className="border-t border-[#ffffff1a]" />

                    {/* SWIFT / International */}
                    <div className="space-y-1.5">
                      <p className="text-[#abc6b7] text-xs font-semibold uppercase tracking-wider">International (SWIFT)</p>
                      {[
                        { label: 'Account Name',       val: 'TISHO ENTERPRISES LTD' },
                        { label: 'IBAN',               val: 'GB96PAYR23118549171401' },
                        { label: 'BIC/SWIFT',          val: 'PAYRGB2LXXX' },
                        { label: 'Intermediary SWIFT', val: 'NWBKGB2L' },
                        { label: 'Institution',        val: 'Payrnet' },
                        { label: 'Address',            val: '86-90 Paul Street, London, EC2A 4NE' },
                        { label: 'Inst. Address',      val: 'Po Box 1130, Cardiff, CF11 1WF' },
                      ].map(r => (
                        <BankRow key={r.label} label={r.label} val={r.val} />
                      ))}
                    </div>

                    <div className="border-t border-[#ffffff1a]" />

                    {/* SEPA */}
                    <div className="space-y-1.5">
                      <p className="text-[#abc6b7] text-xs font-semibold uppercase tracking-wider">International (SEPA)</p>
                      {[
                        { label: 'Account Name', val: 'TISHO ENTERPRISES LTD' },
                        { label: 'SEPA IBAN',    val: 'GB88PAYR00987687162509' },
                        { label: 'SEPA BIC',     val: 'PAYRGB21' },
                        { label: 'Institution',  val: 'Payrnet' },
                        { label: 'Address',      val: '86-90 Paul Street, London, EC2A 4NE' },
                        { label: 'Inst. Address', val: 'Po Box 1130, Cardiff, CF11 1WF' },
                      ].map(r => (
                        <BankRow key={r.label} label={r.label} val={r.val} />
                      ))}
                    </div>
                  </div>
                  <DropZone
                    file={form.screenshot}
                    preview={form.screenshotPreview}
                    onFile={handleFile}
                    onClear={clearFile}
                  />
                  {errors.screenshot && (
                    <p className="text-xs text-[#9c2c2c] mt-1.5 flex items-center gap-1">
                      <Info size={11} />{errors.screenshot}
                    </p>
                  )}
                </section>
              )}

              {/* Stripe path: info panel */}
              {form.paymentMethod === 'stripe' && (
                <div className="rounded-2xl bg-[#f7f9f8] border border-[#e4e7e5] p-4 flex items-start gap-3">
                  <div className="w-9 h-9 bg-white rounded-xl border border-[#e4e7e5] flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard size={18} className="text-[#4a5d54]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#002c14]">You'll be redirected to Stripe</p>
                    <p className="text-xs text-[#7a8a82] mt-1 leading-relaxed">
                      After clicking Submit, you'll be taken to Stripe's secure checkout to complete your payment by card.
                      Once payment is confirmed, your investment will be activated within 1 business day.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e4e7e5] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto gap-2">
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isPending
                  ? (form.paymentMethod === 'stripe' ? 'Redirecting…' : 'Submitting…')
                  : form.paymentMethod === 'stripe'
                  ? 'Continue to Stripe →'
                  : 'Submit Investment Request'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
