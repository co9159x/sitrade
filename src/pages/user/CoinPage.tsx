import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { HistoryChart } from '@/components/market/HistoryChart'
import { WatchButton } from '@/components/market/WatchButton'
import { Button, buttonClass } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { trainingCatalogue } from '@/services/marketData/catalogue'
import { useCoinProfile, usePriceHistory } from '@/hooks/useMarketBoard'
import { useDesk } from '@/hooks/useDesk'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { EMPTY_VALUE, formatCompact, formatDateTime, formatMoney, formatPercent } from '@/utils/format'
import { sanitizeProviderHtml } from '@/utils/sanitizeHtml'

const ranges = [
  { id: '1', label: '1D' },
  { id: '7', label: '7D' },
  { id: '30', label: '30D' },
  { id: '90', label: '3M' },
  { id: '365', label: '1Y' },
  { id: 'max', label: 'ALL' },
]

export function CoinPage() {
  const { assetId = '' } = useParams()
  const coin = useCoinProfile(assetId)
  const [range, setRange] = useState('30')
  const history = usePriceHistory(assetId, range)
  const desk = useDesk()
  const profile = coin.profile
  useDocumentTitle(profile ? profile.name : 'Market')
  const tradable = profile
    ? desk.pairs.some((pair) => pair.baseSymbol === profile.symbol) || trainingCatalogue.some((asset) => asset.symbol === profile.symbol)
    : false
  const description = profile ? sanitizeProviderHtml(profile.descriptionHtml) : ''
  const supplyBase = profile?.maxSupply ?? profile?.totalSupply
  const circulatingShare = profile?.circulatingSupply !== null && profile?.circulatingSupply !== undefined && supplyBase
    ? (profile.circulatingSupply / supplyBase) * 100
    : null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <Link to="/markets" className="text-xs text-muted hover:text-text">Markets</Link>
      {coin.status === 'error' ? <Notice title="Market data unavailable">{coin.message}</Notice> : null}
      {coin.status === 'loading' || !profile ? (
        <p className="text-sm text-muted">{coin.message}</p>
      ) : (
        <>
          <header className="border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {profile.image ? <img src={profile.image} alt="" className="h-10 w-10 rounded-full" /> : null}
                <div>
                  <h1 className="text-2xl font-semibold">{profile.name}</h1>
                  <p className="font-mono text-sm text-muted">{profile.symbol}{profile.rank ? ` · #${profile.rank}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <WatchButton symbol={profile.symbol} />
                <Link to={`/trade/${profile.symbol}-USDT`} className={buttonClass()}>
                  Trade {profile.symbol}
                </Link>
              </div>
            </div>
            <p className="mt-3 font-mono text-3xl">{profile.price === null ? EMPTY_VALUE : formatMoney(profile.price, profile.currency)}</p>
            <p className={`font-mono text-sm ${tone(profile.change24hPercent)}`}>{profile.change24hPercent === null ? EMPTY_VALUE : formatPercent(profile.change24hPercent)}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              <Stat label="Market cap" value={money(profile.marketCap, profile.currency)} />
              <Stat label="24h volume" value={money(profile.volume24h, profile.currency)} />
              <Stat label="24h high" value={money(profile.high24h, profile.currency)} />
              <Stat label="24h low" value={money(profile.low24h, profile.currency)} />
            </dl>
            <p className="mt-3 text-xs text-muted">{coin.message}{profile.asOf ? ` · ${formatDateTime(profile.asOf)}` : ''}</p>
            <p className="mt-1 text-xs text-muted">{tradable ? 'Demo trading available on the training desk.' : 'Market data available. Demo trading is not enabled for this asset.'}</p>
          </header>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Historical price</h2>
              <div className="flex flex-wrap gap-1" role="group" aria-label="History range">
                {ranges.map((item) => (
                  <Button key={item.id} size="compact" variant={range === item.id ? 'secondary' : 'ghost'} aria-pressed={range === item.id} onClick={() => setRange(item.id)}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">ALL is the longest range CoinGecko returns. Prices are not filled in when a range is empty.</p>
            {history.status === 'error' ? <Notice title="History unavailable">{history.message}</Notice> : null}
            {history.status === 'loading' ? <p className="py-8 text-sm text-muted">Loading historical prices.</p> : null}
            {history.points.length > 0 ? <HistoryChart points={history.points} currency={profile.currency} /> : null}
            {history.status === 'ready' && history.points.length === 0 ? <p className="py-6 text-sm text-muted">{history.message}</p> : null}
          </section>

          <section className="max-w-3xl border-t border-white/10 pt-4">
            <h2 className="text-sm font-semibold">About {profile.name}</h2>
            {description ? (
              <div className="prose-invert mt-2 space-y-2 text-sm leading-6 text-muted [&_a]:text-accent-soft" dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              <p className="mt-2 text-sm text-muted">The provider did not return a description.</p>
            )}
            {profile.categories.length > 0 ? <p className="mt-3 text-xs text-muted">{profile.categories.join(' · ')}</p> : null}
          </section>

          <section className="max-w-xl border-t border-white/10 pt-4">
            <h2 className="text-sm font-semibold">History</h2>
            {profile.genesisDate ? (
              <ol className="mt-3 border-l border-white/15">
                <li className="relative pl-4">
                  <span className="absolute top-1.5 -left-[5px] h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  <p className="font-mono text-xs text-muted">{profile.genesisDate.slice(0, 4)}</p>
                  <p className="text-sm text-muted">Launch date reported by CoinGecko: {profile.genesisDate}.</p>
                </li>
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted">Launch date information unavailable from the market data provider.</p>
            )}
          </section>

          <section className="grid gap-6 border-t border-white/10 pt-4 lg:grid-cols-2">
            <article>
              <h2 className="text-sm font-semibold">All-time high and low</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="All-time high" value={money(profile.ath, profile.currency)} />
                <Row label="ATH date" value={profile.athDate ? formatDateTime(profile.athDate) : 'Not available'} />
                <Row label="From ATH" value={profile.athChangePercent === null ? 'Not available' : formatPercent(profile.athChangePercent)} />
                <Row label="All-time low" value={money(profile.atl, profile.currency)} />
                <Row label="ATL date" value={profile.atlDate ? formatDateTime(profile.atlDate) : 'Not available'} />
                <Row label="From ATL" value={profile.atlChangePercent === null ? 'Not available' : formatPercent(profile.atlChangePercent)} />
              </dl>
            </article>
            <article>
              <h2 className="text-sm font-semibold">Supply</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Circulating supply" value={supply(profile.circulatingSupply)} />
                <Row label="Total supply" value={supply(profile.totalSupply)} />
                <Row label="Maximum supply" value={supply(profile.maxSupply)} />
                <Row label="Circulating share" value={circulatingShare === null ? 'Not available' : `${circulatingShare.toFixed(2)}%`} />
              </dl>
            </article>
          </section>

          <section className="max-w-3xl border-t border-white/10 pt-4">
            <h2 className="text-sm font-semibold">Market statistics</h2>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              <Row label="Fully diluted value" value={money(profile.fullyDilutedValue, profile.currency)} />
              <Row label="24h change" value={profile.change24h === null ? 'Not available' : formatMoney(profile.change24h, profile.currency)} />
              <Row label="7d change" value={profile.change7dPercent === null ? 'Not available' : formatPercent(profile.change7dPercent)} />
              <Row label="30d change" value={profile.change30dPercent === null ? 'Not available' : formatPercent(profile.change30dPercent)} />
              <Row label="1y change" value={profile.change1yPercent === null ? 'Not available' : formatPercent(profile.change1yPercent)} />
              <Row label="Market rank" value={profile.rank === null ? 'Not available' : `#${profile.rank}`} />
            </dl>
          </section>

          <section className="border-t border-white/10 pt-4">
            <h2 className="text-sm font-semibold">Official links</h2>
            {profile.links.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Not available</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {profile.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noreferrer noopener" className={buttonClass({ variant: 'secondary', size: 'sm' })}>{link.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {profile.contractAddress ? (
            <section className="max-w-xl border-t border-white/10 pt-4">
              <h2 className="text-sm font-semibold">Blockchain</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Network" value={profile.platform ?? 'Not available'} />
                <Row label="Contract" value={profile.contractAddress} />
              </dl>
            </section>
          ) : (
            <p className="text-xs text-muted">No token contract was returned. Native coins are left without a fabricated address.</p>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono text-sm">{value}</dd>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-mono break-all">{value}</dd>
    </div>
  )
}

function money(value: number | null, currency: string) {
  return value === null ? 'Not available' : formatCompact(value, currency)
}

function supply(value: number | null) {
  if (value === null) return 'Not available'
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value)
}

function tone(value: number | null) {
  if (value === null) return 'text-muted'
  if (value > 0) return 'text-up'
  if (value < 0) return 'text-down'
  return 'text-muted'
}
