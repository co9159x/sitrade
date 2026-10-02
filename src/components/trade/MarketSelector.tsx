import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { TextField } from '@/components/ui/TextField'
import type { DeskAsset, DeskWatch } from '@/services/desk'

export function MarketSelector({
  assets,
  watchlist,
  selectedSymbol,
  onSelect,
  loading,
}: {
  assets: DeskAsset[]
  watchlist: DeskWatch[]
  selectedSymbol: string | null
  onSelect: (symbol: string) => void
  loading: boolean
}) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('pairs')
  const needle = query.trim().toLowerCase()
  const source = tab === 'watchlist' ? watchlist.map((item) => ({ id: item.assetId, symbol: item.symbol, name: item.name })) : assets
  const rows = source.filter((item) => !needle || item.symbol.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle))

  return (
    <section className="flex min-h-80 flex-col rounded-lg border border-line bg-panel">
      <div className="border-b border-line p-3">
        <Tabs
          label="Market lists"
          tabs={[
            { id: 'pairs', label: 'Pairs' },
            { id: 'watchlist', label: 'Watchlist' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mt-3">
          <TextField
            id="pair-search"
            label="Search pairs"
            value={query}
            placeholder="Search symbol"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <EmptyState title="Loading pairs" body="Reading the listed catalogue." />
      ) : rows.length === 0 ? (
        <EmptyState
          title={query ? `No matches for “${query}”` : tab === 'watchlist' ? 'Watchlist is empty' : 'No trading pairs'}
          body="Pairs and watchlists load from the database. Nothing is hardcoded in this list."
        />
      ) : (
        <ul className="max-h-96 overflow-y-auto" role="listbox" aria-label="Trading pairs">
          {rows.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={selectedSymbol === item.symbol}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-panel-raised ${
                  selectedSymbol === item.symbol ? 'border-l-2 border-accent bg-panel-raised' : ''
                }`}
                onClick={() => onSelect(item.symbol)}
              >
                <span className="font-mono font-medium">{item.symbol}</span>
                <span className="truncate pl-3 text-xs text-muted">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
