import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { orderRows, ordersForTab, tradeRows } from '@/components/desk/rows'
import { OrderTable } from '@/components/tables/OrderTable'
import { TradeTable } from '@/components/tables/TradeTable'
import { MarketSelector } from '@/components/trade/MarketSelector'
import { OrderBook } from '@/components/trade/OrderBook'
import { OrderForm } from '@/components/trade/OrderForm'
import { RecentTrades } from '@/components/trade/RecentTrades'
import { TradeHeader } from '@/components/trade/TradeHeader'
import { TradingChart } from '@/components/trade/TradingChart'
import { Notice } from '@/components/ui/Notice'
import { Tabs } from '@/components/ui/Tabs'
import { deskEmpty, useDesk } from '@/hooks/useDesk'
import { assetsForQuotes, useMarketPrices } from '@/hooks/useMarketPrices'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { crossPrice } from '@/services/orders'
import { OrderCancelDialog } from '@/components/trade/OrderCancelDialog'

const bottomTabs = [
  { id: 'open', label: 'Open orders' },
  { id: 'history', label: 'Order history' },
  { id: 'trades', label: 'Trade history' },
  { id: 'recent', label: 'Recent trades' },
]

export function TradePage() {
  useDocumentTitle('Trade')
  const desk = useDesk()
  const quoted = assetsForQuotes(desk.assets, desk.status)
  const market = useMarketPrices(quoted.assets.map((asset) => asset.providerAssetId))
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('open')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const symbol = params.get('symbol')
  const selected = quoted.assets.find((asset) => asset.symbol === symbol) ?? quoted.assets[0] ?? null
  const pair = desk.pairs.find((item) => item.baseSymbol === selected?.symbol) ?? null
  const loading = desk.status === 'loading'
  const price = selected ? market.byId.get(selected.providerAssetId) ?? null : null
  const usdt = quoted.assets.find((asset) => asset.symbol === 'USDT')
  const reference = crossPrice(
    pair ? market.byId.get(pair.baseProviderAssetId)?.price : price?.price,
    pair ? market.byId.get(pair.quoteProviderAssetId)?.price : usdt ? market.byId.get(usdt.providerAssetId)?.price : null,
  )
  const baseBalance = desk.balances.find((row) => row.symbol === pair?.baseSymbol)
  const quoteBalance = desk.balances.find((row) => row.symbol === pair?.quoteSymbol)
  const cancelOrder = desk.orders.find((order) => order.id === cancelId) ?? null

  return (
    <div className="flex flex-col gap-3">
      <h1 className="sr-only">Trade</h1>
      <Notice title="SIMULATED TRADING">
        Orders on this desk update a training wallet only. They are not sent to an exchange, and no cryptocurrency is purchased.
      </Notice>
      {quoted.previewCatalogue ? (
        <Notice tone="info" title="TRAINING CATALOGUE">
          Pairs come from the configured training list until the database is connected. Prices are CoinGecko reference quotes.
        </Notice>
      ) : null}
      {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
      <TradeHeader symbol={selected?.symbol ?? null} name={selected?.name} price={price} />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <MarketSelector
          assets={quoted.assets}
          watchlist={desk.watchlist}
          selectedSymbol={selected?.symbol ?? null}
          loading={loading}
          onSelect={(next) => setParams({ symbol: next })}
        />
        <TradingChart providerAssetId={selected?.providerAssetId ?? null} symbol={selected?.symbol ?? null} />
        <div className="flex flex-col gap-3">
          <OrderBook />
          <OrderForm
            pair={pair}
            referencePrice={reference}
            feeRate={desk.feeRate}
            baseAvailable={desk.status === 'ready' && pair ? (baseBalance?.available ?? 0) : null}
            quoteAvailable={desk.status === 'ready' && pair ? (quoteBalance?.available ?? 0) : null}
          />
        </div>
      </div>
      <section className="rounded-lg border border-line bg-panel p-3">
        <Tabs label="Activity" tabs={bottomTabs} value={tab} onChange={setTab} />
        <div className="mt-3" role="tabpanel">
          {tab === 'recent' ? (
            <RecentTrades />
          ) : tab === 'trades' ? (
            <TradeTable
              rows={tradeRows(desk.trades)}
              loading={loading}
              emptyBody={deskEmpty(desk.status, 'Simulated platform trades will appear here, separate from real market prints.')}
            />
          ) : (
            <OrderTable
              rows={orderRows(ordersForTab(desk.orders, tab), (order) => setCancelId(order.id))}
              loading={loading}
              emptyBody={deskEmpty(
                desk.status,
                tab === 'open' ? 'No open simulated orders.' : 'Completed and cancelled simulated orders will appear here.',
              )}
            />
          )}
        </div>
      </section>
      <OrderCancelDialog order={cancelOrder} onClose={() => setCancelId(null)} />
    </div>
  )
}
