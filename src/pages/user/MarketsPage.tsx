import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppPage } from '@/components/ui/AppPage'
import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'
import { Notice } from '@/components/ui/Notice'
import { Pager } from '@/components/ui/Pager'
import { Tabs } from '@/components/ui/Tabs'
import { TextField } from '@/components/ui/TextField'
import { useDesk } from '@/hooks/useDesk'
import { useMarketBoard } from '@/hooks/useMarketBoard'
import { changeCell, compactCell, moneyCell } from '@/components/desk/rows'
import { paths } from '@/routes/paths'
import { EMPTY_VALUE } from '@/utils/format'

const columns: TableColumn[] = [
  { key: 'rank', label: '#' },
  { key: 'asset', label: 'Coin' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'change', label: '24h', align: 'right' },
  { key: 'high', label: 'High', align: 'right' },
  { key: 'low', label: 'Low', align: 'right' },
  { key: 'volume', label: 'Volume', align: 'right' },
  { key: 'cap', label: 'Market cap', align: 'right' },
  { key: 'watch', label: 'Watchlist' },
]

const filters = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'trending', label: 'Trending' },
  { id: 'cap', label: 'Top market cap' },
  { id: 'gainers', label: 'Top gainers' },
  { id: 'losers', label: 'Top losers' },
  { id: 'volume', label: 'Highest volume' },
]

export function MarketsPage() {
  const desk = useDesk()
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const order = filter === 'volume' ? 'volume_desc' : 'market_cap_desc'
  const board = useMarketBoard(page, order, debounced, filter === 'trending' && debounced.trim().length < 2)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [filter, debounced])

  const watched = useMemo(() => new Set(desk.watchlist.map((item) => item.symbol.toUpperCase())), [desk.watchlist])
  const source = useMemo(() => {
    const rows = filter === 'favorites' ? board.rows.filter((row) => watched.has(row.symbol)) : [...board.rows]
    if (filter === 'gainers') rows.sort((left, right) => (right.change24hPercent ?? -Infinity) - (left.change24hPercent ?? -Infinity))
    if (filter === 'losers') rows.sort((left, right) => (left.change24hPercent ?? Infinity) - (right.change24hPercent ?? Infinity))
    if (filter === 'cap') rows.sort((left, right) => (right.marketCap ?? 0) - (left.marketCap ?? 0))
    return rows
  }, [board.rows, filter, watched])

  const tableRows: TableRow[] = source.map((asset) => ({
    id: asset.providerAssetId,
    cells: {
      rank: asset.rank ?? EMPTY_VALUE,
      asset: (
        <Link to={`/markets/${encodeURIComponent(asset.providerAssetId)}`} className="inline-flex items-center gap-2 font-medium hover:text-accent-soft">
          {asset.image ? <img src={asset.image} alt="" className="h-5 w-5 rounded-full" /> : null}
          <span>{asset.name}</span>
          <span className="font-mono text-xs text-muted">{asset.symbol}</span>
        </Link>
      ),
      price: moneyCell(asset.price, asset.currency),
      change: changeCell(asset.change24hPercent),
      high: moneyCell(asset.high24h, asset.currency),
      low: moneyCell(asset.low24h, asset.currency),
      volume: compactCell(asset.volume24h, asset.currency),
      cap: compactCell(asset.marketCap, asset.currency),
      watch: watched.has(asset.symbol) ? 'Saved' : EMPTY_VALUE,
    },
  }))

  return (
    <AppPage
      title="Markets"
      description="A CoinGecko catalogue of reference quotes. Opening a coin loads its own profile. Simulated trading stays on the desk pairs."
      notice={
        <>
          {board.status === 'error' ? <Notice title="Market data unavailable">{board.message}</Notice> : null}
          {board.status === 'delayed' ? <Notice title="Market data delayed">{board.message}</Notice> : null}
          {filter === 'gainers' || filter === 'losers' ? (
            <Notice tone="info" title="PAGE RANKING">
              Gainers and losers are sorted from the loaded CoinGecko page. Coins outside this page are not invented into the ranking.
            </Notice>
          ) : null}
        </>
      }
    >
      <TextField id="market-search" label="Search" value={query} placeholder="Name, symbol, or provider id" onChange={(event) => setQuery(event.target.value)} />
      <Tabs label="Market filters" tabs={filters} value={filter} onChange={setFilter} />
      <p className="text-xs text-muted">{board.message}{board.updatedAt ? ` · ${board.status}` : ''}</p>
      <DataTable
        caption="Cryptocurrency markets"
        columns={columns}
        rows={tableRows}
        loading={board.status === 'loading'}
        emptyTitle={filter === 'favorites' ? 'No saved assets in this list' : 'No assets'}
        emptyBody={filter === 'favorites' ? 'Favorites are the assets saved on this account. A coin outside the training catalogue cannot be saved yet.' : board.status === 'error' ? board.message : 'CoinGecko did not return a row for this view.'}
      />
      <Pager page={page} pageCount={board.hasMore ? page + 1 : page} onPage={setPage} />
      <p className="text-xs text-muted">
        Recently added coins are not a separate CoinGecko list on this connection. Search still resolves a name, symbol, or id such as Bitcoin, BTC, or bitcoin.{' '}
        <Link to={paths.trade} className="text-accent-soft">Open the trading desk</Link>
      </p>
    </AppPage>
  )
}
