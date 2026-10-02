import { useMemo, useState } from 'react'
import { assetLink, quoteCells } from '@/components/desk/rows'
import { AppPage } from '@/components/ui/AppPage'
import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'
import { Notice } from '@/components/ui/Notice'
import { Tabs } from '@/components/ui/Tabs'
import { TextField } from '@/components/ui/TextField'
import { deskEmpty, useDesk } from '@/hooks/useDesk'
import { assetsForQuotes, useMarketPrices } from '@/hooks/useMarketPrices'

const columns: TableColumn[] = [
  { key: 'asset', label: 'Asset' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'change', label: '24h change', align: 'right' },
  { key: 'high', label: '24h high', align: 'right' },
  { key: 'low', label: '24h low', align: 'right' },
  { key: 'volume', label: 'Volume', align: 'right' },
  { key: 'cap', label: 'Market cap', align: 'right' },
]

const categories = [
  { id: 'all', label: 'All' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'gainers', label: 'Top gainers' },
  { id: 'losers', label: 'Top losers' },
]

export function MarketsPage() {
  const desk = useDesk()
  const quoted = assetsForQuotes(desk.assets, desk.status)
  const market = useMarketPrices(quoted.assets.map((asset) => asset.providerAssetId))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const ranked = category === 'gainers' || category === 'losers'
  const needle = query.trim().toLowerCase()
  const watched = useMemo(() => new Set(desk.watchlist.map((item) => item.assetId)), [desk.watchlist])
  const priced = quoted.assets.filter((asset) => market.byId.has(asset.providerAssetId))

  const source = ranked
    ? [...priced].sort((left, right) => {
        const leftChange = market.byId.get(left.providerAssetId)?.change24hPercent
        const rightChange = market.byId.get(right.providerAssetId)?.change24hPercent
        if (leftChange === null || leftChange === undefined || rightChange === null || rightChange === undefined) return 0
        return category === 'gainers' ? rightChange - leftChange : leftChange - rightChange
      })
    : quoted.assets.filter((asset) => (category === 'watchlist' ? watched.has(asset.id) : true))

  const rows: TableRow[] = source
    .filter((asset) => !needle || asset.symbol.toLowerCase().includes(needle) || asset.name.toLowerCase().includes(needle))
    .filter((asset) => (ranked ? market.byId.get(asset.providerAssetId)?.change24hPercent !== null && market.byId.get(asset.providerAssetId)?.change24hPercent !== undefined : true))
    .map((asset) => ({
      id: asset.id,
      cells: {
        asset: assetLink(asset.symbol, asset.name),
        ...quoteCells(market.byId.get(asset.providerAssetId)),
      },
    }))

  const emptyBody = ranked && market.status.state === 'error'
    ? market.status.message
    : ranked && priced.length === 0
      ? 'Gainers and losers need a 24h change from CoinGecko. That ranking is not invented.'
      : deskEmpty(desk.status, query.trim() ? 'No listed assets match this search.' : 'No listed assets are stored yet.')

  return (
    <AppPage
      title="Markets"
      description="Listed assets and reference quotes in your display currency from CoinGecko. Holdings and orders stay simulated."
      notice={
        <>
          {quoted.previewCatalogue ? (
            <Notice tone="info" title="TRAINING CATALOGUE">
              Supabase is not connected, so this list is the configured training catalogue, not a saved database list. The prices are live CoinGecko quotes.
            </Notice>
          ) : null}
          {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
          {market.status.state === 'error' ? <Notice title="Market data unavailable">{market.status.message}</Notice> : null}
          {market.status.state === 'delayed' ? <Notice title="Market data delayed">{market.status.message}</Notice> : null}
        </>
      }
    >
      <TextField
        id="market-search"
        label="Search markets"
        value={query}
        placeholder="Search by name or symbol"
        onChange={(event) => setQuery(event.target.value)}
      />
      <Tabs label="Market categories" tabs={categories} value={category} onChange={setCategory} />
      <DataTable
        caption="Markets"
        columns={columns}
        rows={rows}
        loading={market.status.state === 'loading' && rows.length === 0}
        emptyTitle={ranked ? 'Ranking unavailable' : query.trim() ? `No matches for “${query.trim()}”` : 'No assets'}
        emptyBody={emptyBody}
      />
    </AppPage>
  )
}
