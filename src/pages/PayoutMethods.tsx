import { useState } from 'react'
import { PlusCircle, Building2, Star, Trash2, ShieldCheck, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  usePayoutMethods,
  useAddPayoutMethod,
  useDeletePayoutMethod,
  useSetPrimaryPayoutMethod,
} from '@/api/payoutMethods'

type Method = NonNullable<ReturnType<typeof usePayoutMethods>['data']>[number]

function maskAccountNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 4) return raw
  return '****' + digits.slice(-4)
}

function maskSortCode(raw: string): string {
  // UK sort code XX-XX-XX → show first segment, mask rest: XX-**-**
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 2) return raw
  return digits.slice(0, 2) + '-**-**'
}

function MethodCard({ method, onDelete, onSetPrimary, isDeleting, isSettingPrimary }: {
  method: Method
  onDelete: () => void
  onSetPrimary: () => void
  isDeleting: boolean
  isSettingPrimary: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Card className={method.is_primary ? 'ring-2 ring-accent-primary' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 bg-surface-subtle rounded-xl flex items-center justify-center shrink-0 border border-border-default">
              <Building2 size={18} className="text-text-secondary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="font-semibold text-text-primary text-sm">{method.label}</p>
                {method.is_primary && (
                  <span className="inline-flex items-center gap-1 bg-accent-highlight text-text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    <Star size={9} /> Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{method.account_name}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
                <span>Account: {method.account_number_masked}</span>
                <span>·</span>
                <span>Sort: {method.sort_code_masked}</span>
              </div>
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

interface AddFormState {
  label: string
  accountName: string
  accountNumber: string
  sortCode: string
}

export function PayoutMethods() {
  const { data: methods, isLoading } = usePayoutMethods()
  const addMethod    = useAddPayoutMethod()
  const deleteMethod = useDeletePayoutMethod()
  const setPrimary   = useSetPrimaryPayoutMethod()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddFormState>({ label: '', accountName: '', accountNumber: '', sortCode: '' })

  const handleChange = (field: keyof AddFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleAdd = async () => {
    if (!form.label.trim() || !form.accountName.trim() || !form.accountNumber.trim() || !form.sortCode.trim()) {
      toast.error('All fields are required')
      return
    }
    try {
      await addMethod.mutateAsync({
        type:                 'bank',
        label:                form.label.trim(),
        account_name:         form.accountName.trim(),
        account_number_masked: maskAccountNumber(form.accountNumber),
        sort_code_masked:     maskSortCode(form.sortCode),
        is_primary:           !methods || methods.length === 0,
      })
      setForm({ label: '', accountName: '', accountNumber: '', sortCode: '' })
      setShowForm(false)
      toast.success('Bank account added')
    } catch (e: any) {
      toast.error('Failed to add account', { description: e.message })
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
          <span className="hidden sm:inline">Add Bank Account</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-dashed border-2 border-border-strong">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Add Bank Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Account label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={handleChange('label')}
                  placeholder="e.g. Barclays Current Account"
                  className="w-full px-4 py-2.5 text-sm rounded-full border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Account holder name</label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={handleChange('accountName')}
                  placeholder="Full name on account"
                  className="w-full px-4 py-2.5 text-sm rounded-full border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Account number</label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={handleChange('accountNumber')}
                  placeholder="12345678"
                  maxLength={8}
                  className="w-full px-4 py-2.5 text-sm rounded-full border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Sort code</label>
                <input
                  type="text"
                  value={form.sortCode}
                  onChange={handleChange('sortCode')}
                  placeholder="20-00-00"
                  maxLength={8}
                  className="w-full px-4 py-2.5 text-sm rounded-full border border-border-default focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Your account number will be masked before saving (e.g. ****4521). We never store full account details.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} disabled={addMethod.isPending} className="gap-1.5">
                {addMethod.isPending && <Loader2 size={13} className="animate-spin" />}
                Save Account
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
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
            <p className="text-xs text-text-muted mt-1">Add a bank account to receive your returns.</p>
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
                  onSuccess: () => toast.success('Account removed'),
                  onError: (e: any) => toast.error('Remove failed', { description: e.message }),
                })
              }
              onSetPrimary={() =>
                setPrimary.mutate(m.id, {
                  onSuccess: () => toast.success('Primary account updated'),
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
            <p className="text-sm font-semibold text-text-primary">Bank details are stored securely</p>
            <p className="text-xs text-text-muted mt-0.5">
              Account numbers are masked before storage. Payments are processed via verified bank transfer only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
