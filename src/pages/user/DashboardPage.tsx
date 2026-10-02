import { Link } from 'react-router-dom'
import { assetLink, orderRows, ordersForTab, quoteCells, transactionRows } from '@/components/desk/rows'
import { PortfolioChart } from '@/components/portfolio/PortfolioChart'
import { OrderTable } from '@/components/tables/OrderTable'
import { TransactionTable } from '@/components/tables/TransactionTable'
import { AppPage } from '@/components/ui/AppPage'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { StatCard } from '@/components/ui/StatCard'
import { deskEmpty, useDesk } from '@/hooks/useDesk'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { assetsForQuotes, pricesBySymbol, useMarketPrices } from '@/hooks/useMarketPrices'
import { summarizePortfolio } from '@/lib/portfolio'
import { paths } from '@/routes/paths'
import { EMPTY_VALUE, formatMoney, formatPercent } from '@/utils/format'

const stats = [
  ['Portfolio value', 'Needs wallet quantities and reference prices. Neither figure is invented here.'],
  ['Available balance', 'USDT available, marked in the display currency. Other assets are not added in.'],
  ['Today’s P/L', '24h move of current quantities at CoinGecko prices.'],
  ['Total P/L', 'Realised trade result after fees, plus unrealised marks on open trade cost.'],
  ['Change', '24h percent move of current priced quantities.'],
  ['Invested value', 'Cost of open trades, including buy fees.'],
] as const

function signedMoney(value: number | null, currency: string) {
  if (value === null) return EMPTY_VALUE
  return value > 0 ? `+${formatMoney(value, currency)}` : formatMoney(value, currency)
}

export function DashboardPage() {
  const desk = useDesk()
  const { currency } = useDisplayCurrency()
  const quoted = assetsForQuotes(desk.assets, desk.status)
  const market = useMarketPrices(quoted.assets.map((asset) => asset.providerAssetId))
  const priced = pricesBySymbol(quoted.assets, market.byId)
  const loading = desk.status === 'loading'
  const openOrders = ordersForTab(desk.orders, 'open')
  const markets = quoted.assets.slice(0, 8)
  const pricedHoldings = desk.balances.filter((row) => priced.has(row.symbol))
  const ready = desk.status === 'ready'
  const summary = summarizePortfolio(ready ? desk.balances : [], ready ? desk.trades : [], priced)
  const totalPnl = summary.realised !== null && summary.unrealised !== null
    ? summary.realised + summary.unrealised
    : summary.realised !== null && summary.invested === null
      ? summary.realised
      : summary.unrealised !== null && summary.realised === null
        ? summary.unrealised
        : null
  const slices = pricedHoldings.flatMap((row) => {
    const price = priced.get(row.symbol)
    if (!price) return []
    return [{ label: row.symbol, value: (row.available + row.locked) * price.price }]
  })
  const values: Record<string, string> = {
    'Portfolio value': summary.totalValue === null ? EMPTY_VALUE : formatMoney(summary.totalValue, currency),
    'Available balance': summary.availableCash === null ? EMPTY_VALUE : formatMoney(summary.availableCash, currency),
    'Today’s P/L': signedMoney(summary.dayMove, currency),
    'Total P/L': signedMoney(totalPnl, currency),
    Change: summary.dayChangePercent === null ? EMPTY_VALUE : formatPercent(summary.dayChangePercent),
    'Invested value': summary.invested === null ? EMPTY_VALUE : formatMoney(summary.invested, currency),
  }

  return (
    <AppPage
      title="Dashboard"
      description="A summary of the simulated wallet, open orders, and markets. Values stay blank until prices and balances exist."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, hint]) => (
          <StatCard
            key={label}
            label={label}
            value={values[label] ?? EMPTY_VALUE}
            hint={
              label === 'Portfolio value' && summary.totalValue !== null
                ? `Mark-to-market in ${currency} from CoinGecko. Unpriced holdings are left out.`
                : hint
            }
          />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <PortfolioChart kind="allocation" slices={slices} currency={currency} />
        <section className="rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Markets</h2>
            <Link to={paths.markets} className="text-xs text-accent-soft">
              All markets
            </Link>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading listed assets…</p>
          ) : markets.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted">{deskEmpty(desk.status, 'No listed assets yet. Prices are not filled in for an empty catalogue.')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {markets.map((asset) => {
                const quote = quoteCells(market.byId.get(asset.providerAssetId))
                return (
                  <li key={asset.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    {assetLink(asset.symbol, asset.name)}
                    <span className="text-right">
                      <span className="block font-mono">{quote.price}</span>
                      <span className="block text-xs">{quote.change}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-lg border border-line bg-panel p-4">
          <h2 className="text-sm font-medium">Quick buy / sell</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Orders are placed on the trade terminal. This card does not submit an order.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="up" disabled>
              Buy
            </Button>
            <Button variant="danger" disabled>
              Sell
            </Button>
            <Link to={paths.trade} className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">
              Open terminal
            </Link>
          </div>
        </section>
        <section className="rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Watchlist</h2>
            <Link to={paths.watchlist} className="text-xs text-accent-soft">
              Edit
            </Link>
          </div>
          {desk.watchlist.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{deskEmpty(desk.status, 'No saved assets yet.')}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {desk.watchlist.slice(0, 6).map((item) => (
                <li key={item.assetId}>{assetLink(item.symbol, item.name)}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-medium">Open orders</h2>
          <OrderTable
            rows={orderRows(openOrders)}
            loading={loading}
            emptyBody={deskEmpty(desk.status, 'Open simulated orders will be listed here.')}
          />
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium">Recent transactions</h2>
          <TransactionTable
            rows={transactionRows(desk.transactions.slice(0, 8))}
            loading={loading}
            emptyBody={deskEmpty(desk.status, 'Deposits, withdrawals, trades, fees, and adjustments will be listed here.')}
          />
        </section>
      </div>
    </AppPage>
  )
}
