import { useState } from 'react'
import { PlusCircle, Building2, Banknote, Globe, Star, Trash2, ShieldCheck, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  usePayoutMethods,
  useAddPayoutMethod,
  useDeletePayoutMethod,
  useSetPrimaryPayoutMethod,
} from '@/api/payoutMethods'

type MethodType = 'bank' | 'cash' | 'western_union' | 'moneygram'
type Method = NonNullable<ReturnType<typeof usePayoutMethods>['data']>[number]

function maskAccountNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 4) return raw
  return '****' + digits.slice(-4)
}

function maskSortCode(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 2) return raw
  return digits.slice(0, 2) + '-**-**'
}

const METHOD_META: Record<MethodType, { label: string; Icon: React.ElementType; color: string }> = {
  bank:          { label: 'Bank Transfer',  Icon: Building2, color: 'text-[#003819]' },
  cash:          { label: 'Cash',           Icon: Banknote,  color: 'text-emerald-600' },
  western_union: { label: 'Western Union',  Icon: Globe,     color: 'text-yellow-600' },
  moneygram:     { label: 'MoneyGram',      Icon: Globe,     color: 'text-[#d0021b]' },
}

function MethodCard({ method, onDelete, onSetPrimary, isDeleting, isSettingPrimary }: {
  method: Method
  onDelete: () => void
  onSetPrimary: () => void
  isDeleting: boolean
  isSettingPrimary: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const meta = METHOD_META[method.type as MethodType] ?? METHOD_META.bank
  const { Icon } = meta

  function renderDetails() {
    switch (method.type as MethodType) {
      case 'bank':
        return (
          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
            <span>Account: {method.account_number_masked}</span>
            <span>·</span>
            <span>Sort: {method.sort_code_masked}</span>
          </div>
        )
      case 'western_union':
      case 'moneygram':
        return (
          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
            {method.account_number_masked && <span>City: {method.account_number_masked}</span>}
            {method.sort_code_masked && <><span>·</span><span>Country: {method.sort_code_masked}</span></>}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className={method.is_primary ? 'ring-2 ring-accent-primary' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 bg-surface-subtle rounded-xl flex items-center justify-center shrink-0 border border-border-default">
              <Icon size={18} className={meta.color} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="font-semibold text-text-primary text-sm">{method.label}</p>
                <span className="text-xs text-text-muted bg-surface-subtle border border-border-default px-2 py-0.5 rounded-full">
                  {meta.label}
                </span>
                {method.is_primary && (
                  <span className="inline-flex items-center gap-1 bg-accent-highlight text-text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    <Star size={9} /> Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{method.account_name}</p>
              {renderDetails()}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {!method.is_primary && (
              <button
                onClick={onSetPrimary}
                disabled={isSettingPrimary}
                className="text-xs text-accent-primary font-medium hover:underline disabled:opacity-50"
              >
                {isSettingPrimary ? 'Setting…' : 'Set primary'}
              </button>
            )}
            {!method.is_primary && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-full hover:bg-red-50 text-text-muted hover:text-status-danger transition-colors"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setConfirmDelete(false); onDelete() }}
                  disabled={isDeleting}
                  className="text-xs text-status-danger font-semibold hover:underline disabled:opacity-50"
                >
                  {isDeleting ? 'Removing…' : 'Confirm'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="p-1 text-text-muted hover:text-text-secondary">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const inputClass = 'w-full px-4 py-2.5 text-sm rounded-full border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary'

const METHOD_TYPES: { value: MethodType; label: string; Icon: React.ElementType }[] = [
  { value: 'bank',          label: 'Bank Transfer', Icon: Building2 },
  { value: 'cash',          label: 'Cash',          Icon: Banknote  },
  { value: 'western_union', label: 'Western Union', Icon: Globe     },
  { value: 'moneygram',     label: 'MoneyGram',     Icon: Globe     },
]

export function PayoutMethods() {
  const { data: methods, isLoading } = usePayoutMethods()
  const addMethod    = useAddPayoutMethod()
  const deleteMethod = useDeletePayoutMethod()
  const setPrimary   = useSetPrimaryPayoutMethod()

  const [showForm, setShowForm] = useState(false)
  const [methodType, setMethodType] = useState<MethodType>('bank')
  const [form, setForm] = useState({ label: '', accountName: '', accountNumber: '', sortCode: '', city: '', country: '' })

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  function resetForm() {
    setForm({ label: '', accountName: '', accountNumber: '', sortCode: '', city: '', country: '' })
    setMethodType('bank')
    setShowForm(false)
  }

  const handleAdd = async () => {
    if (!form.label.trim() || !form.accountName.trim()) {
      toast.error('Label and name are required')
      return
    }
    if (methodType === 'bank' && (!form.accountNumber.trim() || !form.sortCode.trim())) {
      toast.error('Account number and sort code are required')
      return
    }

    let account_number_masked = ''
    let sort_code_masked = ''

    if (methodType === 'bank') {
      account_number_masked = maskAccountNumber(form.accountNumber)
      sort_code_masked      = maskSortCode(form.sortCode)
    } else if (methodType === 'western_union' || methodType === 'moneygram') {
      account_number_masked = form.city.trim()
      sort_code_masked      = form.country.trim()
    }

    try {
      await addMethod.mutateAsync({
        type: methodType,
        label: form.label.trim(),
        account_name: form.accountName.trim(),
        account_number_masked,
        sort_code_masked,
        is_primary: !methods || methods.length === 0,
      })
      resetForm()
      toast.success(`${METHOD_META[methodType].label} method added`)
    } catch (e: any) {
      toast.error('Failed to add method', { description: e.message })
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {isLoading ? 'Loading…' : `${methods?.length ?? 0} payout method(s)`}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(v => !v)}>
          <PlusCircle size={14} />
          <span className="hidden sm:inline">Add Payout Method</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-dashed border-2 border-border-strong">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Add Payout Method</h3>

            {/* Method type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {METHOD_TYPES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethodType(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-medium transition-all',
                    methodType === value
                      ? 'border-[#003819] bg-[#003819] text-white'
                      : 'border-border-default bg-white text-text-secondary hover:border-[#003819]/40'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Label</label>
                <input type="text" value={form.label} onChange={handleChange('label')}
                  placeholder={methodType === 'bank' ? 'e.g. Barclays Current Account' : `e.g. My ${METHOD_META[methodType].label}`}
                  className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {methodType === 'bank' ? 'Account holder name' : 'Recipient name'}
                </label>
                <input type="text" value={form.accountName} onChange={handleChange('accountName')}
                  placeholder="Full name" className={inputClass} />
              </div>

              {methodType === 'bank' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Account number</label>
                    <input type="text" value={form.accountNumber} onChange={handleChange('accountNumber')}
                      placeholder="12345678" maxLength={8} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Sort code</label>
                    <input type="text" value={form.sortCode} onChange={handleChange('sortCode')}
                      placeholder="20-00-00" maxLength={8} className={inputClass} />
                  </div>
                </>
              )}

              {(methodType === 'western_union' || methodType === 'moneygram') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">City</label>
                    <input type="text" value={form.city} onChange={handleChange('city')}
                      placeholder="e.g. London" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Country</label>
                    <input type="text" value={form.country} onChange={handleChange('country')}
                      placeholder="e.g. United Kingdom" className={inputClass} />
                  </div>
                </>
              )}
            </div>

            {methodType === 'bank' && (
              <p className="text-xs text-text-muted mb-4">
                Account number will be masked before saving (e.g. ****4521).
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} disabled={addMethod.isPending} className="gap-1.5">
                {addMethod.isPending && <Loader2 size={13} className="animate-spin" />}
                Save Method
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Method list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-text-muted" />
        </div>
      ) : methods && methods.length === 0 && !showForm ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Building2 size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary">No payout methods yet</p>
            <p className="text-xs text-text-muted mt-1">Add a payout method to receive your returns.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {methods?.map(m => (
            <MethodCard
              key={m.id}
              method={m}
              isDeleting={deleteMethod.isPending}
              isSettingPrimary={setPrimary.isPending}
              onDelete={() =>
                deleteMethod.mutate(m.id, {
                  onSuccess: () => toast.success('Method removed'),
                  onError: (e: any) => toast.error('Remove failed', { description: e.message }),
                })
              }
              onSetPrimary={() =>
                setPrimary.mutate(m.id, {
                  onSuccess: () => toast.success('Primary method updated'),
                  onError: (e: any) => toast.error('Update failed', { description: e.message }),
                })
              }
            />
          ))}
        </div>
      )}

      {/* Security notice */}
      <Card className="bg-surface-subtle">
        <CardContent className="pt-4 flex items-start gap-3">
          <ShieldCheck size={18} className="text-accent-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Your details are stored securely</p>
            <p className="text-xs text-text-muted mt-0.5">
              Bank account numbers are masked before storage. Payments are processed via your chosen method only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
