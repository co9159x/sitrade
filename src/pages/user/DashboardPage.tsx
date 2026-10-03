import { Link } from 'react-router-dom'
import { assetLink, orderRows, ordersForTab, transactionRows } from '@/components/desk/rows'
import { PortfolioChart } from '@/components/portfolio/PortfolioChart'
import { OrderTable } from '@/components/tables/OrderTable'
import { TransactionTable } from '@/components/tables/TransactionTable'
import { MarketCard } from '@/components/landing/MarketCard'
import { AppPage } from '@/components/ui/AppPage'
import { Carousel, CarouselCard } from '@/components/ui/Carousel'
import { Button, buttonClass } from '@/components/ui/Button'
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
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
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
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <div className="min-w-0">
          <PortfolioChart kind="allocation" slices={slices} currency={currency} />
        </div>
        <section className="min-w-0">
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
            <div className="mt-3">
              <Carousel label="Dashboard markets">
                {markets.map((asset, index) => (
                  <CarouselCard key={asset.id}>
                    <MarketCard
                      symbol={asset.symbol}
                      name={asset.name}
                      providerAssetId={asset.providerAssetId}
                      price={market.byId.get(asset.providerAssetId)}
                      chart={index < 4}
                    />
                  </CarouselCard>
                ))}
              </Carousel>
            </div>
          )}
        </section>
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="border-t border-white/10 pt-3">
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
            <Link to={paths.trade} className={buttonClass({ variant: 'secondary' })}>
              Open terminal
            </Link>
          </div>
        </section>
        <section className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Watchlist</h2>
            <Link to={paths.watchlist} className="text-xs text-accent-soft">
              Edit
            </Link>
          </div>
          {desk.watchlist.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{deskEmpty(desk.status, 'No saved assets yet.')}</p>
          ) : (
            <div className="mt-3">
              <Carousel label="Watchlist">
                {desk.watchlist.slice(0, 12).map((item) => {
                  const asset = markets.find((entry) => entry.symbol === item.symbol)
                  return (
                    <CarouselCard key={item.assetId}>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                        {assetLink(item.symbol, item.name, asset?.providerAssetId)}
                      </div>
                    </CarouselCard>
                  )
                })}
              </Carousel>
            </div>
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
