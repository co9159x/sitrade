import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { TableRow } from '@/components/ui/DataTable'
import type { DeskBalance, DeskOrder, DeskTrade, DeskTransaction } from '@/services/desk'
import type { MarketPrice } from '@/services/marketData/types'
import { EMPTY_VALUE, formatAmount, formatCompact, formatDateTime, formatMoney, formatPercent, labelize } from '@/utils/format'

const priceHint = 'Reference price unavailable'

export function moneyCell(value: number | null | undefined, currency = 'GBP') {
  if (value === null || value === undefined) return unavailablePrice()
  return formatMoney(value, currency)
}

export function compactCell(value: number | null | undefined, currency = 'GBP') {
  if (value === null || value === undefined) return unavailablePrice()
  return formatCompact(value, currency)
}

export function changeCell(value: number | null | undefined) {
  if (value === null || value === undefined) return unavailablePrice()
  const tone = value > 0 ? 'text-up' : value < 0 ? 'text-down' : 'text-muted'
  return <span className={tone}>{formatPercent(value)}</span>
}

export function quoteCells(price: MarketPrice | undefined) {
  const currency = price?.currency
  return {
    price: moneyCell(price?.price, currency),
    change: changeCell(price?.change24hPercent),
    high: moneyCell(price?.high24h, currency),
    low: moneyCell(price?.low24h, currency),
    volume: compactCell(price?.volume24h, currency),
    cap: compactCell(price?.marketCap, currency),
  }
}

export function unavailablePrice() {
  return (
    <span title={priceHint} className="text-muted">
      {EMPTY_VALUE}
    </span>
  )
}

export function assetLink(symbol: string, name?: string, providerAssetId?: string) {
  const to = providerAssetId ? `/markets/${encodeURIComponent(providerAssetId)}` : `/trade/${encodeURIComponent(symbol)}-USDT`
  return (
    <Link to={to} className="font-medium hover:text-accent-soft">
      <span className="font-mono">{symbol}</span>
      {name ? <span className="ml-2 text-muted">{name}</span> : null}
    </Link>
  )
}

function sideLabel(side: string) {
  return <span className={side === 'buy' ? 'text-up' : 'text-down'}>{labelize(side)}</span>
}

export function orderRows(orders: DeskOrder[], onCancel?: (order: DeskOrder) => void): TableRow[] {
  return orders.map((order) => ({
    id: order.id,
    cells: {
      pair: order.pair,
      type: labelize(order.type),
      side: sideLabel(order.side),
      price: order.price === null ? EMPTY_VALUE : formatAmount(order.price),
      amount: formatAmount(order.amount),
      filled: formatAmount(order.filled),
      remaining: formatAmount(order.remaining),
      status: labelize(order.status),
      fee: formatAmount(order.fee),
      date: order.createdAt ? formatDateTime(order.createdAt) : EMPTY_VALUE,
      action: onCancel && (order.status === 'open' || order.status === 'inactive') ? (
        <Button type="button" size="compact" variant="ghost" onClick={() => onCancel(order)}>
          Cancel
        </Button>
      ) : EMPTY_VALUE,
    },
  }))
}

export function tradeRows(trades: DeskTrade[]): TableRow[] {
  return trades.map((trade) => ({
    id: trade.id,
    cells: {
      pair: trade.pair,
      side: sideLabel(trade.side),
      price: formatAmount(trade.price),
      amount: formatAmount(trade.amount),
      fee: formatAmount(trade.fee),
      date: trade.createdAt ? formatDateTime(trade.createdAt) : EMPTY_VALUE,
    },
  }))
}

export function transactionRows(rows: DeskTransaction[]): TableRow[] {
  return rows.map((row) => ({
    id: row.id,
    cells: {
      id: <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
      type: labelize(row.type),
      asset: row.asset,
      amount: formatAmount(row.amount),
      status: labelize(row.status),
      date: row.createdAt ? formatDateTime(row.createdAt) : EMPTY_VALUE,
    },
  }))
}

export function holdingRows(
  balances: DeskBalance[],
  prices = new Map<string, MarketPrice>(),
  marks = new Map<string, { averageDisplay: number | null; unrealisedDisplay: number | null }>(),
  currency = 'USD',
): TableRow[] {
  return balances.map((row) => {
    const price = prices.get(row.symbol)
    const mark = marks.get(row.symbol)
    const amount = row.available + row.locked
    const unit = price?.currency ?? currency
    return {
      id: row.id,
      cells: {
        asset: assetLink(row.symbol, row.name),
        amount: formatAmount(amount),
        average: mark?.averageDisplay == null ? EMPTY_VALUE : formatMoney(mark.averageDisplay, unit),
        price: moneyCell(price?.price, unit),
        value: moneyCell(price ? amount * price.price : null, unit),
        pnl: pnlCell(mark?.unrealisedDisplay, unit),
        change: changeCell(price?.change24hPercent),
      } satisfies Record<string, ReactNode>,
    }
  })
}

function pnlCell(value: number | null | undefined, currency: string) {
  if (value == null) return unavailablePrice()
  const tone = value > 0 ? 'text-up' : value < 0 ? 'text-down' : 'text-muted'
  const text = value > 0 ? `+${formatMoney(value, currency)}` : formatMoney(value, currency)
  return <span className={tone}>{text}</span>
}

export function balanceRows(balances: DeskBalance[], prices = new Map<string, MarketPrice>()): TableRow[] {
  return balances.map((row) => {
    const price = prices.get(row.symbol)
    const total = row.available + row.locked
    return {
      id: row.id,
      cells: {
        asset: assetLink(row.symbol, row.name),
        available: formatAmount(row.available),
        locked: formatAmount(row.locked),
        total: formatAmount(total),
        price: moneyCell(price?.price, price?.currency),
        value: moneyCell(price ? total * price.price : null, price?.currency),
        change: changeCell(price?.change24hPercent),
      },
    }
  })
}

const openStatuses = new Set(['open', 'partially_filled', 'inactive'])
const completedStatuses = new Set(['filled'])

export function ordersForTab(orders: DeskOrder[], tab: string) {
  if (tab === 'open') return orders.filter((order) => openStatuses.has(order.status))
  if (tab === 'completed') return orders.filter((order) => completedStatuses.has(order.status))
  if (tab === 'history') return orders.filter((order) => !openStatuses.has(order.status))
  if (tab === 'cancelled') return orders.filter((order) => order.status === 'cancelled' || order.status === 'rejected')
  return orders
}
