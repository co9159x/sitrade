import { useMemo, useState } from 'react'
import { assetLink, quoteCells } from '@/components/desk/rows'
import { AppPage } from '@/components/ui/AppPage'
import { Button } from '@/components/ui/Button'
import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { deskEmpty, useDesk } from '@/hooks/useDesk'
import { assetsForQuotes, useCandles, useMarketPrices } from '@/hooks/useMarketPrices'

const columns: TableColumn[] = [
  { key: 'asset', label: 'Asset' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'change', label: '24h change', align: 'right' },
  { key: 'volume', label: 'Volume', align: 'right' },
  { key: 'cap', label: 'Market cap', align: 'right' },
  { key: 'chart', label: 'Range' },
]

export function WatchlistPage() {
  const desk = useDesk()
  const quoted = assetsForQuotes(desk.assets, desk.status)
  const market = useMarketPrices(
    desk.watchlist.flatMap((item) => {
      const asset = quoted.assets.find((entry) => entry.id === item.assetId || entry.symbol === item.symbol)
      return asset ? [asset.providerAssetId] : []
    }),
  )
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const rows: TableRow[] = useMemo(
    () =>
      desk.watchlist
        .filter((item) => !needle || item.symbol.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle))
        .map((item) => {
          const asset = quoted.assets.find((entry) => entry.id === item.assetId || entry.symbol === item.symbol)
          return {
          id: item.assetId,
          cells: {
            asset: assetLink(item.symbol, item.name, asset?.providerAssetId),
            ...quoteCells(market.byId.get(asset?.providerAssetId ?? '')),
            chart: <MiniRange providerAssetId={asset?.providerAssetId} />,
          },
        }}),
    [desk.watchlist, market.byId, needle, quoted.assets],
  )

  return (
    <AppPage
      title="Watchlist"
      description="Assets saved on this account. Prices and the one-day range follow CoinGecko."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextField
            id="watch-search"
            label="Find a saved asset"
            value={query}
            placeholder="Symbol"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button variant="secondary" disabled>
          Add asset
        </Button>
      </div>
      <p className="text-xs text-muted">Adding or removing an asset is not saved from this screen yet. The table is read from the account.</p>
      <DataTable
        caption="Watchlist"
        columns={columns}
        rows={rows}
        loading={desk.status === 'loading'}
        emptyTitle={query.trim() ? `No matches for “${query.trim()}”` : 'Watchlist is empty'}
        emptyBody={deskEmpty(desk.status, 'No assets are saved on this account.')}
      />
    </AppPage>
  )
}

function MiniRange({ providerAssetId }: { providerAssetId?: string }) {
  const chart = useCandles(providerAssetId ?? null, '1D')
  const closes = chart.candles.map((candle) => candle.close)
  if (!providerAssetId || closes.length < 2) return <span className="text-xs text-muted">Not available</span>
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const points = closes
    .map((value, index) => `${(index / (closes.length - 1)) * 72},${18 - ((value - min) / span) * 16}`)
    .join(' ')
  const rising = closes[closes.length - 1] >= closes[0]
  return (
    <svg viewBox="0 0 72 20" className="h-5 w-[72px]" aria-hidden="true">
      <polyline fill="none" stroke={rising ? '#2fce8f' : '#ff5c6a'} strokeWidth="1.5" points={points} />
    </svg>
  )
}
