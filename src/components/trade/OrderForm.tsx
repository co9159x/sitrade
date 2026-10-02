import { useRef, useState, type FormEvent } from 'react'
import type { OrderSide, OrderType } from '@/types'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import type { DeskPair } from '@/services/desk'
import { submitSimulatedOrder, validateOrderInput, validateOrderPrice } from '@/services/orders'
import { validateTrainingAmount } from '@/services/wallet'
import { EMPTY_VALUE, formatAmount } from '@/utils/format'

const orderTypes: { id: OrderType; label: string }[] = [
  { id: 'market', label: 'Market' },
  { id: 'limit', label: 'Limit' },
  { id: 'stop', label: 'Stop' },
]

export function OrderForm({
  pair,
  referencePrice,
  baseAvailable,
  quoteAvailable,
  feeRate,
}: {
  pair: DeskPair | null
  referencePrice: number | null
  baseAvailable: number | null
  quoteAvailable: number | null
  feeRate: number | null
}) {
  const { configured, session } = useAuth()
  const { push } = useToast()
  const [side, setSide] = useState<OrderSide>('buy')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)
  const rate = feeRate ?? 0.001
  const unit = orderType === 'market' ? referencePrice : Number(price)
  const amountError = amount.trim() ? validateTrainingAmount(amount)?.replace('training deposit', 'training order') ?? null : null
  const priceError = orderType === 'market' || !price.trim() ? null : validateOrderPrice(price)
  const notional = amountError === null && priceError === null && amount.trim() && unit !== null && Number.isFinite(unit) && unit > 0 ? Number(amount) * unit : null
  const fee = notional === null ? null : notional * rate
  const total = notional === null || fee === null ? null : side === 'buy' ? notional + fee : notional - fee
  const available = side === 'buy' ? quoteAvailable : baseAvailable
  const availableLabel = side === 'buy' ? pair?.quoteSymbol : pair?.baseSymbol
  const validationError = validateOrderInput({
    amount,
    price,
    orderType,
    referencePrice,
  })
  const balanceError = side === 'buy' && quoteAvailable !== null && total !== null && total > quoteAvailable
    ? 'Insufficient simulated balance.'
    : side === 'sell' && baseAvailable !== null && amount.trim() && !amountError && Number(amount) > baseAvailable
      ? 'Insufficient simulated balance.'
      : null
  const problem = balanceError ?? validationError
  const canSubmit = Boolean(configured && session && pair?.tradingEnabled && !problem && !submitting)

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (pending.current || !pair) return
    if (problem) {
      setError(problem)
      setConfirming(false)
      return
    }
    if (!configured || !session) {
      setError('Sign in with a configured account before a simulated order can be saved.')
      setConfirming(false)
      return
    }
    pending.current = true
    setSubmitting(true)
    setError(null)
    try {
      await submitSimulatedOrder({
        pairId: pair.id,
        side,
        orderType,
        amount: Number(amount),
        limitPrice: orderType === 'limit' ? Number(price) : null,
        stopPrice: orderType === 'stop' ? Number(price) : null,
        referencePrice: referencePrice ?? 0,
        requestToken: crypto.randomUUID(),
      })
      setAmount('')
      setPrice('')
      setConfirming(false)
      push({
        tone: 'success',
        title: 'Simulated order accepted',
        description: 'The training wallet was updated in one step. No exchange order was sent.',
      })
    } catch (reason) {
      setConfirming(false)
      setError(reason instanceof Error ? reason.message : 'The order could not be saved.')
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-3" aria-label="Order entry">
      <form onSubmit={(event) => { event.preventDefault(); if (canSubmit) setConfirming(true) }}>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-bg p-1" role="tablist" aria-label="Order side">
          {(['buy', 'sell'] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={side === item}
              className={`h-9 rounded-md text-sm font-medium ${
                side === item ? (item === 'buy' ? 'bg-up text-bg' : 'bg-down text-white') : 'text-muted'
              }`}
              onClick={() => setSide(item)}
            >
              {item === 'buy' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-1" role="group" aria-label="Order type">
          {orderTypes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={orderType === item.id}
              className={`h-8 rounded-md px-2 text-xs ${orderType === item.id ? 'bg-panel-raised text-text' : 'text-muted'}`}
              onClick={() => setOrderType(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-3">
          {orderType === 'market' ? null : (
            <TextField
              id="order-price"
              label={orderType === 'stop' ? `Stop price (${pair?.quoteSymbol ?? 'quote'})` : `Price (${pair?.quoteSymbol ?? 'quote'})`}
              inputMode="decimal"
              value={price}
              error={priceError}
              onChange={(event) => setPrice(event.target.value)}
            />
          )}
          <TextField
            id="order-amount"
            label={`Amount (${pair?.baseSymbol ?? 'base'})`}
            inputMode="decimal"
            value={amount}
            error={amountError}
            onChange={(event) => setAmount(event.target.value)}
          />
          <TextField id="order-total" label={`Total (${pair?.quoteSymbol ?? 'quote'})`} value={total === null ? '' : formatAmount(total)} disabled readOnly placeholder={EMPTY_VALUE} />
        </div>
        <dl className="mt-3 space-y-1 text-xs text-muted">
          <div className="flex justify-between gap-3">
            <dt>Available balance</dt>
            <dd className="font-mono text-text">{available === null ? EMPTY_VALUE : `${formatAmount(available)} ${availableLabel ?? ''}`.trim()}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Estimated fee</dt>
            <dd className="font-mono text-text">{fee === null ? EMPTY_VALUE : `${formatAmount(fee)} ${pair?.quoteSymbol ?? ''}`.trim()}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Reference price</dt>
            <dd className="font-mono text-text">{referencePrice === null ? EMPTY_VALUE : formatAmount(referencePrice)}</dd>
          </div>
        </dl>
        {error || balanceError ? <p className="mt-3 text-xs text-down" role="alert">{error || balanceError}</p> : null}
        <Button className="mt-4 w-full" type="submit" variant={side === 'buy' ? 'up' : 'danger'} disabled={!canSubmit}>
          {submitting ? 'Saving...' : `${side === 'buy' ? 'Buy' : 'Sell'}${pair ? ` ${pair.baseSymbol}` : ''}`}
        </Button>
        <p className="mt-2 text-xs leading-5 text-muted">
          {pair
            ? `${pair.symbol} uses a CoinGecko cross as the reference. Fee ${(rate * 100).toFixed(2)}%. ${referencePrice === null ? 'Waiting for a reference price. ' : ''}A market order fills now. A limit or stop rests until the reference reaches it. Nothing is sent to an exchange.`
            : 'Sign in after the trading migration is applied. Amount and price checks still run here, and nothing is stored from this browser alone.'}
        </p>
      </form>
      <ConfirmationModal
        open={confirming}
        title={`${side === 'buy' ? 'Buy' : 'Sell'} ${pair?.baseSymbol ?? ''}`.trim()}
        body={`${orderType} order for ${amount || '0'} ${pair?.baseSymbol ?? ''} on ${pair?.symbol ?? 'the pair'}. Estimated fee ${fee === null ? EMPTY_VALUE : formatAmount(fee)} ${pair?.quoteSymbol ?? ''}. This is a training fill only.`}
        confirmLabel={submitting ? 'Saving...' : 'Place simulated order'}
        tone={side === 'sell' ? 'danger' : 'primary'}
        onConfirm={() => void onSubmit()}
        onClose={() => { if (!submitting) setConfirming(false) }}
      />
    </section>
  )
}
