import { useRef, useState, type FormEvent } from 'react'
import { AppPage } from '@/components/ui/AppPage'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { SelectField, TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { useDesk } from '@/hooks/useDesk'
import { submitSimulatedDeposit, validateTrainingAmount } from '@/services/wallet'
import { EMPTY_VALUE, formatAmount } from '@/utils/format'

export function DepositPage() {
  const desk = useDesk()
  const { configured, session } = useAuth()
  const { push } = useToast()
  const [symbol, setSymbol] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)
  const openAssets = desk.assets.filter((asset) => asset.depositsEnabled)
  const selected = openAssets.find((asset) => asset.symbol === symbol) ?? null
  const balance = desk.balances.find((row) => row.symbol === selected?.symbol)
  const knownBalance = desk.status === 'ready' && selected ? (balance?.available ?? 0) : null
  const amountError = amount.trim() ? validateTrainingAmount(amount) : null
  const parsed = Number(amount)
  const nextBalance = knownBalance !== null && amountError === null && amount.trim() ? knownBalance + parsed : null
  const canSubmit = Boolean(configured && session && selected && amount.trim() && !amountError && !submitting)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending.current) return
    const problem = validateTrainingAmount(amount)
    if (!selected) {
      setError('Select an asset.')
      return
    }
    if (problem) {
      setError(problem)
      return
    }
    if (!configured || !session) {
      setError('Sign in with a configured account before a simulated deposit can be saved.')
      return
    }
    pending.current = true
    setSubmitting(true)
    setError(null)
    try {
      await submitSimulatedDeposit(selected.id, Number(amount), crypto.randomUUID())
      setAmount('')
      desk.reload()
      push({ tone: 'success', title: 'Simulated deposit credited', description: 'The training balance, deposit record, and notification were saved together.' })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The deposit could not be saved.')
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  return (
    <AppPage
      title="Deposit"
      description="Add simulated funds to a training balance. No real money is accepted."
      notice={
        <>
          <Notice title="SIMULATED DEPOSIT">
            This deposit does not collect a card, bank transfer, or cryptocurrency. A saved amount is only an application balance.
          </Notice>
          {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
          {error ? <Notice title="Deposit not saved">{error}</Notice> : null}
        </>
      }
    >
      <form className="grid max-w-xl gap-4" onSubmit={(event) => void onSubmit(event)}>
        <SelectField
          id="deposit-currency"
          label="Currency"
          value={symbol}
          disabled={openAssets.length === 0}
          onChange={(event) => setSymbol(event.target.value)}
        >
          <option value="">{openAssets.length === 0 ? 'No currencies open for deposit' : 'Select an asset'}</option>
          {openAssets.map((asset) => (
            <option key={asset.id} value={asset.symbol}>
              {asset.symbol} — {asset.name}
            </option>
          ))}
        </SelectField>
        <TextField id="deposit-current" label="Current simulated balance" value={knownBalance === null ? EMPTY_VALUE : formatAmount(knownBalance)} disabled readOnly />
        <TextField
          id="deposit-amount"
          label="Deposit amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          error={amountError ?? undefined}
          onChange={(event) => setAmount(event.target.value)}
        />
        <TextField id="deposit-next" label="New simulated balance" value={nextBalance === null ? EMPTY_VALUE : formatAmount(nextBalance)} disabled readOnly />
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Saving...' : 'Submit simulated deposit'}
        </Button>
        <p className="text-xs text-muted">
          {configured && session
            ? 'A valid amount is credited immediately and written with a deposit record, a ledger entry, and a notification.'
            : 'Sign in after Supabase is configured to save a deposit. Amount checks still run here, and nothing is stored from this browser alone.'}
        </p>
      </form>
    </AppPage>
  )
}
