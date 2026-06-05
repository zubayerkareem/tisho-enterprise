import * as React from 'react'
import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, CheckCircle2, Info, ChevronDown } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { compactTierRate } from '@/lib/investments'
import type { InvestmentType, PayoutFrequency } from '@/types/models'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  policy: InvestmentType | ''
  amount: string
  payoutFrequency: PayoutFrequency
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
    const monthly = (amount * 0.25) / 12
    return {
      rate: '25% per year',
      monthly,
      total: monthly * 24,
      principalBack: true,
      tierNote: null,
    }
  }

  // compact
  const rate = compactTierRate(amount)
  const monthly = (amount * rate) / 100
  return {
    rate: `${rate}% per month`,
    monthly,
    total: monthly * 24,
    principalBack: false,
    tierNote: rate >= 8 ? 'Tier rate provisional — subject to client confirmation.' : null,
  }
}

function fmt(n: number) {
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PolicyCard({
  type, selected, onSelect,
}: { type: InvestmentType; selected: boolean; onSelect: () => void }) {
  const isComprehensive = type === 'comprehensive'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003819]',
        selected
          ? 'border-[#003819] bg-[#003819]'
          : 'border-[#e4e7e5] bg-white hover:border-[#c5cdc9]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-[#002c14]')}>
          {isComprehensive ? 'Comprehensive Policy' : 'Compact Policy'}
        </span>
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
          selected
            ? 'bg-[#c3f63c] text-[#002c14]'
            : isComprehensive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        )}>
          {isComprehensive ? '25% / year' : '6–10% / month'}
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

function DropZone({
  file, preview, onFile, onClear,
}: {
  file: File | null
  preview: string | null
  onFile: (f: File) => void
  onClear: () => void
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
        dragging
          ? 'border-[#003819] bg-[#003819]/5'
          : 'border-[#c5cdc9] hover:border-[#003819] hover:bg-[#f7f9f8]'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
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
          <Info size={12} className="shrink-0" />
          {r.tierNote}
        </p>
      )}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AddInvestmentModal({ open, onClose }: AddInvestmentModalProps) {
  const [form, setForm] = useState<FormState>({
    policy: '',
    amount: '',
    payoutFrequency: 'monthly',
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
    if (amountNum < 500) e.amount = 'Minimum investment is £500.'
    if (!form.screenshot) e.screenshot = 'Please upload your bank transfer screenshot.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    // No live backend here — just show success state
    setSubmitted(true)
  }

  function handleClose() {
    setSubmitted(false)
    setForm({ policy: '', amount: '', payoutFrequency: 'monthly', screenshot: null, screenshotPreview: null })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {submitted ? (
          // ── Success state ─────────────────────────────────────────────────
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
          // ── Form ──────────────────────────────────────────────────────────
          <form onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#e4e7e5]">
              <DialogHeader>
                <DialogTitle>Add New Investment</DialogTitle>
                <DialogDescription>
                  Select your policy, enter the amount you've transferred, and upload your bank transfer screenshot.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Step 1 — Policy */}
              <section>
                <label className="block text-sm font-semibold text-[#002c14] mb-3">
                  1. Select Policy
                </label>
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
                    min="500"
                    step="100"
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

                {/* Quick amount chips */}
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

              {/* Payout frequency (comprehensive only) */}
              {form.policy === 'comprehensive' && (
                <section>
                  <label className="block text-sm font-semibold text-[#002c14] mb-3">
                    3. Payout Frequency
                  </label>
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

              {/* Bank transfer screenshot upload */}
              <section>
                <label className="block text-sm font-semibold text-[#002c14] mb-1.5">
                  {form.policy === 'comprehensive' ? '4' : '3'}. Bank Transfer Screenshot
                </label>
                <p className="text-xs text-[#7a8a82] mb-3">
                  Please transfer the funds to our bank account first, then upload a screenshot of the confirmed transfer here.
                </p>

                {/* Bank details */}
                <div className="bg-[#003819] rounded-2xl p-4 mb-4 text-sm space-y-1.5">
                  <p className="text-[#abc6b7] text-xs font-semibold uppercase tracking-wider mb-2">Transfer To</p>
                  {[
                    { label: 'Account Name', val: 'Tisho Enterprises Ltd' },
                    { label: 'Account Number', val: '12345678' },
                    { label: 'Sort Code', val: '20-45-67' },
                    { label: 'Reference', val: `INV-${Date.now().toString().slice(-6)}` },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between gap-4">
                      <span className="text-[#abc6b7] text-xs">{r.label}</span>
                      <span className="text-white font-medium text-xs">{r.val}</span>
                    </div>
                  ))}
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
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e4e7e5] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto gap-2">
                Submit Investment Request
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
