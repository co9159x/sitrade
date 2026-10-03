import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { searchMarketAssets } from '@/services/marketData'
import type { MarketListing } from '@/services/marketData/types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { crossPrice } from '@/services/orders'
import { OrderCancelDialog } from '@/components/trade/OrderCancelDialog'

const bottomTabs = [
  { id: 'open', label: 'Open orders' },
  { id: 'history', label: 'Order history' },
  { id: 'trades', label: 'Demo trades' },
  { id: 'recent', label: 'Market trades' },
]

export function TradePage() {
  useDocumentTitle('Trade')
  const desk = useDesk()
  const quoted = assetsForQuotes(desk.assets, desk.status)
  const navigate = useNavigate()
  const { pair: pairSlug } = useParams()
  const [params] = useSearchParams()
  const [tab, setTab] = useState('open')
  const [panel, setPanel] = useState('chart')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [external, setExternal] = useState<MarketListing | null>(null)
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'missing' | 'error'>('idle')
  const requested = pairSlug?.split('-')[0]?.toUpperCase() || params.get('symbol')
  const selected = quoted.assets.find((asset) => asset.symbol === requested) ?? (requested ? null : quoted.assets[0] ?? null)
  useEffect(() => {
    if (!requested || quoted.assets.some((asset) => asset.symbol === requested)) {
      setExternal(null)
      setLookup('idle')
      return
    }
    let active = true
    setLookup('loading')
    searchMarketAssets(requested)
      .then((rows) => {
        if (!active) return
        const match = rows.find((row) => row.symbol === requested) ?? null
        setExternal(match)
        setLookup(match ? 'idle' : 'missing')
      })
      .catch(() => {
        if (!active) return
        setExternal(null)
        setLookup('error')
      })
    return () => {
      active = false
    }
  }, [quoted.assets, requested])
  const providerId = selected?.providerAssetId ?? external?.providerAssetId ?? null
  const market = useMarketPrices([...quoted.assets.map((asset) => asset.providerAssetId), providerId ?? ''].filter(Boolean))
  const pair = desk.pairs.find((item) => item.baseSymbol === selected?.symbol) ?? null
  const loading = desk.status === 'loading'
  const price = providerId ? market.byId.get(providerId) ?? null : null
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
      <TradeHeader
        symbol={selected?.symbol ?? external?.symbol ?? requested}
        name={selected?.name ?? external?.name}
        price={price}
        pairLabel={selected || external || requested ? `${selected?.symbol ?? external?.symbol ?? requested}/USDT` : null}
      />
      {!selected && external ? (
        <Notice tone="info" title="MARKET DATA AVAILABLE">
          {external.name} has a live reference chart. It is not in the simulated trading catalogue, so the order ticket cannot place a training order for it.
        </Notice>
      ) : null}
      {lookup === 'error' ? <Notice title="Market data temporarily unavailable">The selected pair could not be resolved. No other asset was substituted.</Notice> : null}
      {lookup === 'missing' ? <Notice title="No matching asset">CoinGecko did not return {requested}. No other asset was substituted.</Notice> : null}
      <div className="xl:hidden">
        <Tabs
          label="Trade panels"
          tabs={[
            { id: 'chart', label: 'Chart' },
            { id: 'book', label: 'Order book' },
            { id: 'trade', label: 'Trade' },
          ]}
          value={panel}
          onChange={setPanel}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <div className={panel === 'chart' ? '' : 'hidden xl:block'}>
          <MarketSelector
            assets={quoted.assets}
            watchlist={desk.watchlist}
            selectedSymbol={selected?.symbol ?? null}
            loading={loading}
            onSelect={(next) => navigate(`/trade/${next}-USDT`)}
          />
        </div>
        <div className={panel === 'chart' ? '' : 'hidden xl:block'}>
          <TradingChart providerAssetId={providerId} symbol={selected?.symbol ?? external?.symbol ?? requested} />
        </div>
        <div id="order-entry" className="flex scroll-mt-4 flex-col gap-3">
          <div className={panel === 'book' ? '' : 'hidden xl:block'}>
            <OrderBook />
          </div>
          <div className={panel === 'trade' ? '' : 'hidden xl:block'}>
          <OrderForm
            pair={pair}
            referencePrice={reference}
            feeRate={desk.feeRate}
            baseAvailable={desk.status === 'ready' && pair ? (baseBalance?.available ?? 0) : null}
            quoteAvailable={desk.status === 'ready' && pair ? (quoteBalance?.available ?? 0) : null}
          />
          </div>
        </div>
      </div>
      <section className="rounded-lg border border-line bg-panel p-3">
        <Tabs label="Activity" tabs={bottomTabs} value={tab} onChange={setTab} />
        <div className="mt-3" role="tabpanel" aria-labelledby={`tab-Activity-${tab}`}>
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
