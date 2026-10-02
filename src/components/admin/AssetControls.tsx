import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { adminSetAssetState, adminUpdateAssetTerms } from '@/services/adminOps'

type AssetAction =
  | 'list'
  | 'delist'
  | 'enable_trading'
  | 'disable_trading'
  | 'enable_deposits'
  | 'disable_deposits'
  | 'enable_withdrawals'
  | 'disable_withdrawals'

const labels: Record<AssetAction, string> = {
  list: 'List',
  delist: 'Delist',
  enable_trading: 'Enable trading',
  disable_trading: 'Disable trading',
  enable_deposits: 'Enable deposits',
  disable_deposits: 'Disable deposits',
  enable_withdrawals: 'Enable withdrawals',
  disable_withdrawals: 'Disable withdrawals',
}

export function AssetControls({
  assetId,
  listed,
  tradingEnabled,
  depositsEnabled,
  withdrawalsEnabled,
  minOrder,
  withdrawalFee,
  configured,
  onSaved,
}: {
  assetId: string
  listed: boolean
  tradingEnabled: boolean
  depositsEnabled: boolean
  withdrawalsEnabled: boolean
  minOrder: number
  withdrawalFee: number
  configured: boolean
  onSaved: () => void
}) {
  const { push } = useToast()
  const [note, setNote] = useState('')
  const [termsNote, setTermsNote] = useState('')
  const [min, setMin] = useState(String(minOrder))
  const [fee, setFee] = useState(String(withdrawalFee))
  const [pending, setPending] = useState<AssetAction | 'terms' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const noteReady = note.trim().length >= 3 && note.trim().length <= 280
  const termsReady = termsNote.trim().length >= 3 && termsNote.trim().length <= 280
  const minValue = Number(min)
  const feeValue = Number(fee)
  const termsValid = min.trim() !== '' && fee.trim() !== '' && Number.isFinite(minValue) && minValue >= 0 && minValue <= 1e9 && Number.isFinite(feeValue) && feeValue >= 0 && feeValue <= 1e9

  const actions: AssetAction[] = [
    listed ? 'delist' : 'list',
    tradingEnabled ? 'disable_trading' : 'enable_trading',
    depositsEnabled ? 'disable_deposits' : 'enable_deposits',
    withdrawalsEnabled ? 'disable_withdrawals' : 'enable_withdrawals',
  ]

  async function confirm() {
    if (!pending) return
    setSaving(true)
    setError(null)
    try {
      if (pending === 'terms') {
        if (!termsReady || !termsValid) throw new Error('Enter a non-negative minimum and fee, plus a note of 3 to 280 characters.')
        await adminUpdateAssetTerms(assetId, minValue, feeValue, termsNote.trim())
        setTermsNote('')
      } else {
        if (!noteReady) throw new Error('Enter a note between 3 and 280 characters.')
        await adminSetAssetState(assetId, pending, note.trim())
        setNote('')
      }
      const saved = pending
      setPending(null)
      onSaved()
      push({
        tone: 'success',
        title: saved === 'terms' ? 'Asset terms saved' : labels[saved],
        description: saved === 'delist'
          ? 'The asset left market discovery. Historical trades and ledger rows were kept.'
          : 'The change was written with an audit log. Prices were not overridden.',
      })
    } catch (reason) {
      setPending(null)
      setError(reason instanceof Error ? reason.message : 'The asset was not changed.')
    } finally {
      setSaving(false)
    }
  }

  const title = pending === 'terms' ? 'Save asset terms' : pending ? labels[pending] : ''
  const body = pending === 'delist'
    ? 'Delist this asset, and close trading, deposits, and withdrawals. Historical trades, orders, and ledger rows stay stored.'
    : pending === 'terms'
      ? 'Save the simulated minimum order and withdrawal fee. This does not change a market price.'
      : 'Save this catalogue flag. Existing history is left in place.'

  return (
    <div className="mt-4 space-y-4">
      <TextField id="asset-note" label="Reason" value={note} onChange={(event) => setNote(event.target.value)} />
      {error ? <p className="text-xs text-down" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant={action === 'delist' || action.startsWith('disable') ? 'danger' : 'secondary'}
            disabled={!configured || !noteReady || saving}
            onClick={() => setPending(action)}
          >
            {labels[action]}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted">Delisting removes the asset from market discovery and blocks new training trades, deposits, and withdrawals. Historical records stay, and later screens mark them as delisted.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id="asset-min" label="Minimum order" value={min} onChange={(event) => setMin(event.target.value)} inputMode="decimal" />
        <TextField id="asset-fee" label="Simulated withdrawal fee" value={fee} onChange={(event) => setFee(event.target.value)} inputMode="decimal" />
      </div>
      <TextField id="asset-terms-note" label="Terms note" value={termsNote} onChange={(event) => setTermsNote(event.target.value)} />
      <Button type="button" size="sm" disabled={!configured || !termsReady || !termsValid || saving} onClick={() => setPending('terms')}>
        Save terms
      </Button>
      <p className="text-xs text-muted">New symbols and trading pairs are not created from this screen. Prices still come from the market-data provider.</p>
      <ConfirmationModal
        open={pending !== null}
        title={title}
        body={body}
        confirmLabel={saving ? 'Saving...' : 'Confirm'}
        onConfirm={() => void confirm()}
        onClose={() => { if (!saving) setPending(null) }}
      />
    </div>
  )
}
