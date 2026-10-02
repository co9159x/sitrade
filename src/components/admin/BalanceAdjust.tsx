import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { SelectField, TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { adminAdjustBalance, validateTrainingAmount } from '@/services/wallet'
import type { AdminAsset } from '@/services/adminDesk'

export function BalanceAdjust({
  userId,
  userLabel,
  assets,
  configured,
  onSaved,
}: {
  userId: string
  userLabel: string
  assets: AdminAsset[]
  configured: boolean
  onSaved: () => void
}) {
  const { push } = useToast()
  const [assetId, setAssetId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [direction, setDirection] = useState<'add' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const amountError = amount.trim() ? validateTrainingAmount(amount) : null
  const noteError = note.trim() && (note.trim().length < 3 || note.trim().length > 280) ? 'Enter a note between 3 and 280 characters.' : null
  const asset = assets.find((item) => item.id === assetId) ?? null

  async function confirm() {
    if (!direction || !asset) return
    const problem = validateTrainingAmount(amount) ?? noteError
    if (problem || note.trim().length < 3) {
      setError(problem ?? 'Enter a note between 3 and 280 characters.')
      setDirection(null)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await adminAdjustBalance({
        userId,
        assetId: asset.id,
        amount: Number(amount),
        direction,
        note: note.trim(),
      })
      setAmount('')
      setNote('')
      setDirection(null)
      onSaved()
      push({
        tone: 'success',
        title: direction === 'add' ? 'Balance added' : 'Balance removed',
        description: 'The change, ledger entry, and audit log were saved together.',
      })
    } catch (reason) {
      setDirection(null)
      setError(reason instanceof Error ? reason.message : 'The balance was not changed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-medium">Adjust simulated balance</h3>
      <SelectField id="adjust-asset" label="Currency" value={assetId} disabled={!configured || assets.length === 0} onChange={(event) => setAssetId(event.target.value)}>
        <option value="">{assets.length === 0 ? 'No assets loaded' : 'Select an asset'}</option>
        {assets.map((item) => (
          <option key={item.id} value={item.id}>{item.symbol} — {item.name}</option>
        ))}
      </SelectField>
      <TextField id="adjust-amount" label="Amount" inputMode="decimal" value={amount} error={amountError} onChange={(event) => setAmount(event.target.value)} />
      <TextField id="adjust-note" label="Note" value={note} error={noteError} onChange={(event) => setNote(event.target.value)} />
      {error ? <p className="text-xs text-down" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={!configured || !asset || Boolean(amountError) || !amount.trim() || note.trim().length < 3 || saving} onClick={() => setDirection('add')}>
          Add balance
        </Button>
        <Button type="button" size="sm" variant="danger" disabled={!configured || !asset || Boolean(amountError) || !amount.trim() || note.trim().length < 3 || saving} onClick={() => setDirection('remove')}>
          Remove balance
        </Button>
      </div>
      <p className="text-xs text-muted">
        {configured
          ? 'Each change writes a ledger entry and an audit log. Removing more than the available balance is rejected.'
          : 'Supabase is not configured, so this form cannot change a balance.'}
      </p>
      <ConfirmationModal
        open={direction !== null}
        title={direction === 'remove' ? 'Remove simulated balance' : 'Add simulated balance'}
        body={`${direction === 'remove' ? 'Remove' : 'Add'} ${amount || '0'} ${asset?.symbol ?? ''} ${direction === 'remove' ? 'from' : 'to'} ${userLabel}. This is a training balance only.`}
        confirmLabel={saving ? 'Saving...' : 'Confirm adjustment'}
        tone={direction === 'remove' ? 'danger' : 'primary'}
        onConfirm={() => void confirm()}
        onClose={() => { if (!saving) setDirection(null) }}
      />
    </div>
  )
}
