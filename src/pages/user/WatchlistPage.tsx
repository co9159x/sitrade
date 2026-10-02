import { useMemo, useState } from 'react'
import { assetLink, quoteCells } from '@/components/desk/rows'
import { AppPage } from '@/components/ui/AppPage'
import { Button } from '@/components/ui/Button'
import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { deskEmpty, useDesk } from '@/hooks/useDesk'
import { assetsForQuotes, useMarketPrices } from '@/hooks/useMarketPrices'

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
        .map((item) => ({
          id: item.assetId,
          cells: {
            asset: assetLink(item.symbol, item.name),
            ...quoteCells(market.byId.get(quoted.assets.find((entry) => entry.id === item.assetId || entry.symbol === item.symbol)?.providerAssetId ?? '')),
            chart: <span className="text-xs text-muted">Open the terminal for the chart</span>,
          },
        })),
    [desk.watchlist, market.byId, needle, quoted.assets],
  )

  return (
    <AppPage
      title="Watchlist"
      description="Assets saved on this account. Prices follow the display currency. The range chart is on the trade terminal."
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
