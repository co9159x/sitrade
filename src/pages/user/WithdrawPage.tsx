import { useRef, useState, type FormEvent } from 'react'
import { AppPage } from '@/components/ui/AppPage'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { Notice } from '@/components/ui/Notice'
import { SelectField, TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { useDesk } from '@/hooks/useDesk'
import { requestDeskRefresh } from '@/services/orders'
import { submitSimulatedWithdrawal, validateDestination, validateTrainingAmount } from '@/services/wallet'
import { EMPTY_VALUE, formatAmount } from '@/utils/format'

export function WithdrawPage() {
  const desk = useDesk()
  const { configured, session } = useAuth()
  const { push } = useToast()
  const [symbol, setSymbol] = useState('')
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)
  const openAssets = desk.assets.filter((asset) => asset.withdrawalsEnabled)
  const selected = openAssets.find((asset) => asset.symbol === symbol) ?? null
  const balance = desk.balances.find((row) => row.symbol === selected?.symbol)
  const available = desk.status === 'ready' && selected ? (balance?.available ?? 0) : null
  const fee = selected ? selected.withdrawalFee : null
  const amountError = amount.trim() ? validateTrainingAmount(amount)?.replace('training deposit', 'training withdrawal') ?? null : null
  const destinationError = destination.trim() ? validateDestination(destination) : null
  const parsed = Number(amount)
  const reserved = amountError === null && amount.trim() && fee !== null ? parsed + fee : null
  const remaining = available !== null && reserved !== null ? available - reserved : null
  const balanceError = remaining !== null && remaining < 0 ? 'Insufficient simulated balance.' : null
  const canSubmit = Boolean(
    configured && session && selected && amount.trim() && destination.trim() && !amountError && !destinationError && !balanceError && !submitting,
  )

  async function onSubmit() {
    if (pending.current || !selected) return
    const problem = validateTrainingAmount(amount)?.replace('training deposit', 'training withdrawal')
      ?? validateDestination(destination)
      ?? balanceError
    if (problem) {
      setError(problem)
      setConfirming(false)
      return
    }
    if (!configured || !session) {
      setError('Sign in with a configured account before a simulated withdrawal can be saved.')
      setConfirming(false)
      return
    }
    pending.current = true
    setSubmitting(true)
    setError(null)
    try {
      await submitSimulatedWithdrawal(selected.id, Number(amount), destination.trim(), crypto.randomUUID())
      setAmount('')
      setDestination('')
      setConfirming(false)
      requestDeskRefresh()
      push({
        tone: 'success',
        title: 'Simulated withdrawal requested',
        description: 'The amount and network fee are locked until an administrator reviews the request. Nothing was sent to a network.',
      })
    } catch (reason) {
      setConfirming(false)
      setError(reason instanceof Error ? reason.message : 'The withdrawal could not be saved.')
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  return (
    <AppPage
      title="Withdraw"
      description="Request a simulated withdrawal. No blockchain transaction is created."
      notice={
        <>
          <Notice title="SIMULATED WITHDRAWAL">
            The destination is a reference only. Funds are not sent to a wallet, bank, or network.
          </Notice>
          {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
          {error ? <Notice title="Withdrawal not saved">{error}</Notice> : null}
        </>
      }
    >
      <form
        className="grid max-w-xl gap-4"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          if (canSubmit) setConfirming(true)
        }}
      >
        <SelectField
          id="withdraw-asset"
          label="Asset"
          value={symbol}
          disabled={openAssets.length === 0}
          onChange={(event) => setSymbol(event.target.value)}
        >
          <option value="">{openAssets.length === 0 ? 'No assets open for withdrawal' : 'Select an asset'}</option>
          {openAssets.map((asset) => (
            <option key={asset.id} value={asset.symbol}>
              {asset.symbol} — {asset.name}
            </option>
          ))}
        </SelectField>
        <TextField id="withdraw-available" label="Available balance" value={available === null ? EMPTY_VALUE : formatAmount(available)} disabled readOnly />
        <TextField
          id="withdraw-amount"
          label="Withdrawal amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          error={amountError ?? balanceError}
          onChange={(event) => setAmount(event.target.value)}
        />
        <TextField
          id="withdraw-destination"
          label="Destination address or reference"
          placeholder="Reference only"
          value={destination}
          error={destinationError}
          onChange={(event) => setDestination(event.target.value)}
        />
        <TextField id="withdraw-fee" label="Network fee" value={fee === null ? EMPTY_VALUE : formatAmount(fee)} disabled readOnly />
        <TextField id="withdraw-remaining" label="Remaining balance" value={remaining === null || remaining < 0 ? EMPTY_VALUE : formatAmount(remaining)} disabled readOnly />
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Saving...' : 'Submit simulated withdrawal'}
        </Button>
        <p className="text-xs text-muted">
          {configured && session
            ? 'A valid request locks the amount plus the simulated network fee until an administrator marks it processing, completed, or rejected.'
            : 'Sign in after Supabase is configured to save a withdrawal. Amount and reference checks still run here, and nothing is reserved from this browser alone.'}
        </p>
      </form>
      <ConfirmationModal
        open={confirming}
        title="Submit simulated withdrawal"
        body={`Lock ${amount || '0'} ${selected?.symbol ?? ''} plus a network fee of ${fee === null ? EMPTY_VALUE : formatAmount(fee)}. The destination is stored as a reference. No blockchain transaction is created.`}
        confirmLabel={submitting ? 'Saving...' : 'Request withdrawal'}
        tone="danger"
        onConfirm={() => void onSubmit()}
        onClose={() => { if (!submitting) setConfirming(false) }}
      />
    </AppPage>
  )
}
