import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LogoLink } from '@/components/brand/Logo'
import { MarketTicker, type TapeQuote } from '@/components/landing/MarketTicker'
import { OrderBook } from '@/components/trade/OrderBook'
import { RecentTrades } from '@/components/trade/RecentTrades'
import { TradingChart } from '@/components/trade/TradingChart'
import { Button, buttonClass } from '@/components/ui/Button'
import { Carousel, CarouselCard } from '@/components/ui/Carousel'
import { HistoryChart } from '@/components/market/HistoryChart'
import { SkipLink } from '@/components/ui/SkipLink'
import { useCandles } from '@/hooks/useMarketPrices'
import { useCoinProfile, useMarketBoard, usePriceHistory } from '@/hooks/useMarketBoard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'
import type { MarketListing } from '@/services/marketData/types'
import { sanitizeProviderHtml } from '@/utils/sanitizeHtml'
import { EMPTY_VALUE, formatAmount, formatCompact, formatMoney, formatPercent } from '@/utils/format'

const tapeSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE']

const primaryLink = buttonClass()
const secondaryLink = buttonClass({ variant: 'secondary' })

const nav = [
  ['Markets', '#markets'],
  ['Trade', '#terminal'],
  ['Portfolio', '#portfolio'],
  ['How It Works', '#how'],
] as const

const steps = [
  ['01', 'Create a Demo Account', 'Registration opens a training profile and an empty simulated wallet. Nothing is funded with a hidden balance.'],
  ['02', 'Explore Real Markets', 'Prices, ranges, and coin profiles come from the market provider. A missing quote stays blank.'],
  ['03', 'Place Simulated Trades', 'Market, limit, and stop orders update the training ledger. They are never sent to an exchange.'],
  ['04', 'Analyse Your Portfolio', 'Value and profit or loss use simulated holdings and the latest reference price.'],
]

const features = [
  ['Real Market Data', 'Live reference prices, ranges, volume, and market cap.'],
  ['Professional Charts', 'Candles from provider history, with gaps left empty.'],
  ['Simulated Trading', 'Orders fill inside the training wallet only.'],
  ['Portfolio Analytics', 'Mark-to-market value of simulated holdings.'],
  ['Market History', 'Daily and longer ranges from the same provider.'],
  ['Watchlists', 'Save listed desk assets to your training account.'],
  ['Order Management', 'Open, history, and cancel stay on the ledger.'],
  ['Demo Wallet', 'Deposits and withdrawals are records, not transfers.'],
]

const realPoints = ['Market prices', 'Historical prices', 'Candlestick data', 'Market cap', 'Volume', '24h statistics', 'ATH / ATL', 'Coin information']
const simulatedPoints = ['Balances', 'Deposits', 'Withdrawals', 'Orders', 'Trades', 'Portfolio', 'Profit and loss']

export function LandingPage() {
  useDocumentTitle('')
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(96)
  const board = useMarketBoard(1, 'market_cap_desc', '', false)
  const bySymbol = useMemo(() => new Map(board.rows.map((row) => [row.symbol, row])), [board.rows])
  const bitcoin = bySymbol.get('BTC')
  const tape = tapeSymbols.map((symbol) => ({ symbol, price: quoteOf(bySymbol.get(symbol)) }))
  const needle = query.trim().toLowerCase()
  const tableRows = (needle
    ? board.rows.filter((row) => `${row.symbol} ${row.name}`.toLowerCase().includes(needle))
    : board.rows
  ).slice(0, 10)
  const featured = board.rows.slice(0, 8)

  useEffect(() => {
    const node = headerRef.current
    if (!node) return
    const measure = () => setHeaderHeight(node.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [open])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#07080c] text-[#eceae6]" style={{ fontFamily: '"Instrument Sans", Outfit, sans-serif' }}>
      <SkipLink />
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-30">
        <p className="glass-soft rounded-none border-x-0 border-t-0 px-4 py-1.5 text-center text-[11px] tracking-[0.16em] text-white/70">
          <span className="inline-flex items-center gap-2 text-warn">
            <span className="demo-dot" aria-hidden="true" />
            DEMO / TRAINING ENVIRONMENT
          </span>
          <span className="mx-2 text-white/25" aria-hidden="true">·</span>
          Balances, trades, deposits, and withdrawals have no real monetary value.
        </p>
        <div className={`border-b border-white/10 transition-all duration-300 ${scrolled ? 'glass-primary rounded-none border-x-0 border-t-0' : 'bg-black/20 backdrop-blur-md'}`}>
          <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[1fr_auto] items-center px-4 md:grid-cols-[1fr_auto_1fr]">
            <LogoLink />
            <nav aria-label="Landing" className="hidden items-center gap-7 text-[13px] text-white/60 md:flex">
              {nav.map(([label, href]) => (
                <a key={label} href={href} className="hover:text-white">{label}</a>
              ))}
            </nav>
            <div className="hidden items-center justify-end gap-2 md:flex">
              <Link to={paths.login} className={secondaryLink}>Log In</Link>
              <Link to={paths.register} className={primaryLink}>Start Trading</Link>
            </div>
            <button
              type="button"
              className={buttonClass({ variant: 'ghost', size: 'icon', className: 'justify-self-end md:hidden' })}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {open ? (
            <nav aria-label="Landing mobile" className="glass-float mx-3 mb-3 flex flex-col rounded-2xl px-4 py-2 md:hidden">
              {nav.map(([label, href]) => (
                <a key={label} href={href} className="py-3 text-sm text-white/80" onClick={() => setOpen(false)}>{label}</a>
              ))}
              <Link to={paths.login} className="py-3 text-sm" onClick={() => setOpen(false)}>Log In</Link>
              <Link to={paths.register} className="py-3 text-sm text-accent-soft" onClick={() => setOpen(false)}>Start Trading</Link>
            </nav>
          ) : null}
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="relative flex min-h-dvh flex-col overflow-hidden" style={{ paddingTop: headerHeight }}>
          <div className="desk-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="glow-drift pointer-events-none absolute top-24 -left-16 h-80 w-80 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute right-0 bottom-8 h-96 w-96 rounded-full bg-up/15 blur-3xl" aria-hidden="true" />
          <MarketTicker rows={tape} />
          <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-16">
            <div className="rise max-w-xl">
              <p className="text-[11px] tracking-[0.22em] text-warn">DEMO / TRAINING ENVIRONMENT</p>
              <h1 className="mt-5 text-5xl leading-[0.96] font-medium tracking-[-0.03em] text-white sm:text-7xl">
                Trade the Market.
                <span className="mt-1 block text-white/55">Train Without the Risk.</span>
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">
                Trade using real crypto market data with a completely simulated portfolio. Explore markets, practise strategies and experience a professional trading environment without using real money.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to={paths.register} className={primaryLink}>Start Trading</Link>
                <Link to={paths.markets} className={secondaryLink}>Explore Markets</Link>
              </div>
            </div>
            <div className="rise-late">
              <HeroMarket listing={bitcoin} status={board.status} message={board.message} />
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-20 md:py-28 lg:grid-cols-12">
          <p className="text-[11px] tracking-[0.22em] text-white/45 lg:col-span-3">THE MARKET</p>
          <Reveal className="lg:col-span-9">
            <h2 className="max-w-3xl text-3xl leading-tight font-medium tracking-[-0.03em] text-white sm:text-5xl">
              Crypto markets move continuously. This desk is for reading those moves and practising the decision, not for sending money.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/55">
              Quotes, charts, and coin profiles stay tied to the market provider. Balances, orders, deposits, and withdrawals stay inside the training ledger.
            </p>
          </Reveal>
        </section>

        <section id="markets" className="scroll-mt-28 border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xl">
                <p className="text-[11px] tracking-[0.22em] text-white/45">MARKETS</p>
                <h2 className="mt-3 text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">Explore the Market</h2>
                <p className="mt-4 text-sm leading-7 text-white/55">Track real crypto market data across a broad range of assets.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="text-[11px] tracking-[0.16em] text-white/40" htmlFor="landing-market-search">Search</label>
                <input
                  id="landing-market-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Asset or symbol"
                  className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3.5 text-sm outline-none backdrop-blur-md placeholder:text-white/30 sm:w-52"
                />
                <Link to={paths.markets} className="text-sm text-white/70 hover:text-white">View All Markets</Link>
              </div>
            </div>
            <p className="mt-6 text-xs text-white/40">{board.message}</p>
            <div className="glass-soft mt-4 overflow-x-auto rounded-2xl px-4">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-[11px] tracking-[0.14em] text-white/40">
                  <tr className="border-b border-white/10">
                    {['Asset', 'Price', '24h', '24h High', '24h Low', 'Volume', 'Market Cap'].map((label) => (
                      <th key={label} className="py-3 pr-4 font-medium">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.providerAssetId} className="border-b border-white/10 hover:bg-white/[0.03]">
                      <td className="py-3 pr-4">
                        <Link to={`/markets/${encodeURIComponent(row.providerAssetId)}`} className="flex items-center gap-3">
                          {row.image ? <img src={row.image} alt="" className="h-6 w-6 rounded-full" /> : <span className="h-6 w-6 rounded-full border border-white/15" />}
                          <span>
                            <span className="block text-white">{row.name}</span>
                            <span className="font-mono text-[11px] text-white/45">{row.symbol}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-mono text-[13px]">{formatMoney(row.price, row.currency)}</td>
                      <td className={`py-3 pr-4 font-mono text-[13px] ${tone(row.change24hPercent)}`}>{percent(row.change24hPercent)}</td>
                      <td className="py-3 pr-4 font-mono text-[13px] text-white/70">{money(row.high24h, row.currency)}</td>
                      <td className="py-3 pr-4 font-mono text-[13px] text-white/70">{money(row.low24h, row.currency)}</td>
                      <td className="py-3 pr-4 font-mono text-[13px] text-white/70">{compact(row.volume24h, row.currency)}</td>
                      <td className="py-3 pr-4 font-mono text-[13px] text-white/70">{compact(row.marketCap, row.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableRows.length === 0 ? (
                <p className="py-8 text-sm text-white/50">
                  {needle ? 'No assets match that search on the loaded page.' : board.status === 'loading' ? 'Loading market data.' : board.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section id="terminal" className="scroll-mt-28 border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <p className="text-[11px] tracking-[0.22em] text-white/45">PROFESSIONAL TRADING TERMINAL</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">Everything You Need to Read the Market</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
              The same chart used on the trade desk. Prices are provider history. The order book and public trade tape stay empty when the provider does not supply them. This preview cannot place an order.
            </p>
            <Reveal>
            <div className="mt-10 overflow-x-auto">
              <div className="glass-float grid min-w-[920px] gap-3 rounded-3xl p-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <div className="p-3">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
                    <div>
                      <p className="text-[11px] tracking-[0.16em] text-white/40">BTC/USDT</p>
                      <p className="mt-1 font-mono text-2xl text-white">{bitcoin ? formatMoney(bitcoin.price, bitcoin.currency) : EMPTY_VALUE}</p>
                      <p className={`font-mono text-xs ${tone(bitcoin?.change24hPercent)}`}>{percent(bitcoin?.change24hPercent)} reference</p>
                    </div>
                    <Link to={`${paths.trade}/BTC-USDT`} className="text-sm text-white/70 hover:text-white">Open the terminal</Link>
                  </div>
                  <LazyTerminalChart />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="glass-soft rounded-2xl p-3">
                    <OrderBook />
                  </div>
                  <div className="glass-soft rounded-2xl p-4">
                    <p className="text-[11px] tracking-[0.16em] text-white/40">ORDER TICKET</p>
                    <p className="mt-2 text-xs leading-5 text-white/50">Buy and sell run on the trade page after sign-in. These controls are inactive.</p>
                    <div className="mt-4 flex w-fit gap-2">
                      <Button type="button" variant="up" className="min-w-24" disabled>Buy</Button>
                      <Button type="button" variant="danger" className="min-w-24" disabled>Sell</Button>
                    </div>
                  </div>
                  <div className="glass-soft rounded-2xl">
                    <RecentTrades />
                  </div>
                </div>
              </div>
            </div>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">Real Market Data. Simulated Trading.</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <Reveal>
              <div className="glass-soft h-full rounded-2xl p-6">
                <p className="text-[11px] tracking-[0.22em] text-white/45">REAL</p>
                <ul className="mt-6 divide-y divide-white/10">
                  {realPoints.map((item) => <li key={item} className="py-3 text-sm text-white/80">{item}</li>)}
                </ul>
              </div>
              </Reveal>
              <Reveal delay={120}>
              <div className="glass-soft h-full rounded-2xl p-6">
                <p className="text-[11px] tracking-[0.22em] text-warn">SIMULATED</p>
                <ul className="mt-6 divide-y divide-white/10">
                  {simulatedPoints.map((item) => <li key={item} className="py-3 text-sm text-white/80">{item}</li>)}
                </ul>
              </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="portfolio" className="scroll-mt-28 border-t border-white/10">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 md:py-28 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-[11px] tracking-[0.22em] text-white/45">PORTFOLIO</p>
              <h2 className="mt-3 text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">A ledger you can read.</h2>
              <p className="mt-4 text-sm leading-7 text-white/55">
                The public page does not load an account. Figures stay blank here. After sign-in, the portfolio marks simulated quantities with the current reference price.
              </p>
              <Link to={paths.portfolio} className="mt-6 inline-flex text-sm text-white/70 hover:text-white">Open portfolio</Link>
            </div>
            <div className="glass-float rounded-3xl lg:col-span-7">
              <p className="border-b border-white/10 px-4 py-3 text-[11px] tracking-[0.16em] text-warn">NO ACCOUNT LOADED</p>
              <dl className="grid grid-cols-2">
                {['Total portfolio value', 'Available balance', 'Invested value', 'Profit and loss'].map((label) => (
                  <div key={label} className="border-b border-white/10 px-4 py-4 even:border-l">
                    <dt className="text-[11px] tracking-[0.12em] text-white/40">{label}</dt>
                    <dd className="mt-2 font-mono text-lg text-white/80">{EMPTY_VALUE}</dd>
                  </div>
                ))}
              </dl>
              <div className="grid sm:grid-cols-2">
                <div className="border-t border-white/10 px-4 py-5 sm:border-r">
                  <p className="text-[11px] tracking-[0.14em] text-white/40">ASSET ALLOCATION</p>
                  <p className="mt-3 text-sm text-white/50">No holdings. Allocation is not drawn without a training account.</p>
                </div>
                <div className="border-t border-white/10 px-4 py-5">
                  <p className="text-[11px] tracking-[0.14em] text-white/40">PERFORMANCE</p>
                  <p className="mt-3 text-sm text-white/50">No performance series. Profit and loss is not invented for this page.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-28 border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <p className="text-[11px] tracking-[0.22em] text-white/45">HOW IT WORKS</p>
            <h2 className="mt-3 max-w-xl text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">Four steps. No capital.</h2>
            <ol className="mt-14 grid gap-3 md:grid-cols-4">
              {steps.map(([number, title, body], index) => (
                <li key={number} className="glass-soft glass-card rounded-2xl p-5" style={{ animationDelay: `${index * 80}ms` }}>
                  <p className="font-mono text-sm text-white/35">{number}</p>
                  <h3 className="mt-4 text-xl font-medium tracking-tight text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <h2 className="max-w-xl text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">The desk, kept small.</h2>
            <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(([title, body]) => (
                <li key={title} className="glass-soft glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-white/45">FEATURED</p>
                <h2 className="mt-3 text-4xl font-medium tracking-[-0.03em] text-white">Assets in view</h2>
              </div>
            </div>
            <div className="mt-8 min-w-0">
              {featured.length > 0 ? (
                <Carousel label="Featured assets">
                  {featured.map((asset, index) => (
                    <CarouselCard key={asset.providerAssetId}>
                      <FeaturedAsset asset={asset} chart={index < 4} />
                    </CarouselCard>
                  ))}
                </Carousel>
              ) : (
                <p className="text-sm text-white/50">{board.status === 'loading' ? 'Loading assets.' : board.message}</p>
              )}
            </div>
          </div>
        </section>

        <ResearchPreview />

        <section id="demo" className="scroll-mt-28 border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
            <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">Built for Practice. Not Real Money.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
              This platform uses real cryptocurrency market data for educational and training purposes. All balances, deposits, withdrawals, orders and trades are simulated. No real cryptocurrency is purchased, transferred or held.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
            <h2 className="max-w-3xl text-5xl font-medium tracking-[-0.03em] text-white sm:text-6xl">Ready to Explore the Market?</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/55">Start practising with real market data in a simulated trading environment.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={paths.register} className={primaryLink}>Start Trading</Link>
              <Link to={paths.markets} className={secondaryLink}>Explore Markets</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <LogoLink />
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">A training desk for crypto markets. Real reference data. Simulated money.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white/60">
            <a href="#markets" className="hover:text-white">Markets</a>
            <a href="#terminal" className="hover:text-white">Trade</a>
            <a href="#portfolio" className="hover:text-white">Portfolio</a>
            <a href="#how" className="hover:text-white">How It Works</a>
            <a href="#demo" className="hover:text-white">About / Demo Information</a>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white/60">
            <a href="#privacy" className="hover:text-white">Privacy</a>
            <a href="#terms" className="hover:text-white">Terms</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </div>
        </div>
        <div id="privacy" className="scroll-mt-28 mx-auto w-full max-w-6xl border-t border-white/10 px-4 py-8">
          <h2 className="text-sm font-medium text-white">Privacy</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Account access uses the existing sign-in. This page does not collect a mailing list. Market requests go to the public price provider already used by the desk.</p>
        </div>
        <div id="terms" className="scroll-mt-28 mx-auto w-full max-w-6xl border-t border-white/10 px-4 py-8">
          <h2 className="text-sm font-medium text-white">Terms</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Sitrade is a demo and training environment. It is not a financial service, an exchange, or a custodian. Simulated balances cannot be withdrawn as cryptocurrency or cash.</p>
        </div>
        <div id="contact" className="scroll-mt-28 mx-auto w-full max-w-6xl border-t border-white/10 px-4 py-8">
          <h2 className="text-sm font-medium text-white">Contact</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Questions about a training account are handled after you sign in. This public page does not send messages.</p>
        </div>
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-xs tracking-[0.12em] text-white/35">© 2026 SITRADE</p>
      </footer>
    </div>
  )
}

function HeroMarket({ listing, status, message }: { listing: MarketListing | undefined; status: string; message: string }) {
  return (
    <div className="glass-float rounded-3xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-white/40">BTC · REFERENCE</p>
          <p className="mt-2 font-mono text-3xl text-white">{listing ? formatMoney(listing.price, listing.currency) : EMPTY_VALUE}</p>
          <p className={`mt-1 font-mono text-xs ${tone(listing?.change24hPercent)}`}>{percent(listing?.change24hPercent)} 24h</p>
        </div>
        <p className="text-right text-[11px] leading-5 text-white/40">{status === 'loading' ? 'Loading market data' : message}</p>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
        <Stat label="24h High" value={money(listing?.high24h, listing?.currency)} />
        <Stat label="24h Low" value={money(listing?.low24h, listing?.currency)} />
        <Stat label="Volume" value={compact(listing?.volume24h, listing?.currency)} />
        <Stat label="Market Cap" value={compact(listing?.marketCap, listing?.currency)} />
      </dl>
      <TradingChart
        providerAssetId="bitcoin"
        symbol="BTC"
        domId="landing-hero-chart"
        className="min-h-[220px] rounded-none border-0 bg-transparent sm:min-h-[260px]"
        frameClassName="min-h-[150px] sm:min-h-[170px]"
      />
    </div>
  )
}

function LazyTerminalChart() {
  const host = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    const node = host.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setActive(true)
    }, { rootMargin: '160px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={host}>
      {active ? (
        <TradingChart
          providerAssetId="bitcoin"
          symbol="BTC"
          domId="landing-terminal-chart"
          className="min-h-[360px] rounded-none border-0 bg-transparent shadow-none sm:min-h-[420px]"
        />
      ) : (
        <p className="px-2 py-16 text-sm text-white/45">The candlestick chart loads with this section.</p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3">
      <dt className="text-[10px] tracking-[0.14em] text-white/40">{label}</dt>
      <dd className="mt-1 font-mono text-xs text-white">{value}</dd>
    </div>
  )
}

function FeaturedAsset({ asset, chart }: { asset: MarketListing; chart: boolean }) {
  return (
    <Link to={`/markets/${encodeURIComponent(asset.providerAssetId)}`} className="glass-soft glass-card flex h-full flex-col rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {asset.image ? <img src={asset.image} alt="" className="h-8 w-8 rounded-full" /> : <span className="h-8 w-8 rounded-full border border-white/15" />}
        <span>
          <span className="block text-sm text-white">{asset.name}</span>
          <span className="font-mono text-[11px] text-white/45">{asset.symbol}</span>
        </span>
      </div>
      <span className="mt-5 font-mono text-lg text-white">{formatMoney(asset.price, asset.currency)}</span>
      <span className={`mt-1 font-mono text-xs ${tone(asset.change24hPercent)}`}>{percent(asset.change24hPercent)}</span>
      {chart ? <MiniChart providerAssetId={asset.providerAssetId} /> : <span className="mt-4 h-9" />}
    </Link>
  )
}

function MiniChart({ providerAssetId }: { providerAssetId: string }) {
  const chart = useCandles(providerAssetId, '1D')
  const closes = chart.candles.map((candle) => candle.close)
  if (chart.phase !== 'ready' || closes.length < 2) return <span className="mt-4 block h-9 text-[11px] text-white/35">{chart.phase === 'error' ? 'Chart unavailable' : ''}</span>
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const path = closes.map((value, index) => {
    const x = (index / (closes.length - 1)) * 120
    const y = 32 - ((value - min) / span) * 28
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const rising = closes[closes.length - 1] >= closes[0]
  return (
    <svg viewBox="0 0 120 36" className="mt-4 h-9 w-full" aria-hidden="true">
      <path d={path} fill="none" stroke={rising ? '#2fce8f' : '#ff5c6a'} strokeWidth="1.4" />
    </svg>
  )
}

function ResearchPreview() {
  const host = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    const node = host.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setActive(true)
    }, { rootMargin: '240px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const coin = useCoinProfile(active ? 'bitcoin' : undefined)
  const history = usePriceHistory(active ? 'bitcoin' : undefined, '365')
  const profile = coin.profile
  const about = profile ? plainText(profile.descriptionHtml) : ''

  return (
    <section ref={host} className="border-t border-white/10">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28">
        <p className="text-[11px] tracking-[0.22em] text-white/45">RESEARCH</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-medium tracking-[-0.03em] text-white sm:text-5xl">Know What You Are Trading</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">Bitcoin, as published by the market provider. Missing fields stay blank.</p>
        {active && coin.status === 'loading' ? <p className="mt-10 text-sm text-white/45">Loading coin information.</p> : null}
        {active && coin.status === 'error' ? <p className="mt-10 text-sm text-white/55">{coin.message}</p> : null}
        {profile ? (
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <div className="flex items-center gap-3">
                {profile.image ? <img src={profile.image} alt="" className="h-10 w-10 rounded-full" /> : null}
                <div>
                  <p className="text-lg text-white">{profile.name}</p>
                  <p className="font-mono text-xs text-white/45">{profile.symbol}{profile.rank ? ` · Rank ${profile.rank}` : ''}</p>
                </div>
              </div>
              <h3 className="mt-8 text-[11px] tracking-[0.16em] text-white/40">ABOUT</h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">{about || 'No description was returned.'}</p>
              <h3 className="mt-8 text-[11px] tracking-[0.16em] text-white/40">PROJECT HISTORY</h3>
              <p className="mt-3 text-sm text-white/65">{profile.genesisDate ? `Genesis ${profile.genesisDate.slice(0, 4)}.` : 'An exact genesis date was not returned.'}</p>
              <div className="mt-8 h-52">
                {history.status === 'error' ? <p className="text-sm text-white/50">{history.message}</p> : null}
                {history.points.length > 0 ? <HistoryChart points={history.points} currency={profile.currency} /> : history.status === 'loading' ? <p className="text-sm text-white/45">Loading historical prices.</p> : null}
              </div>
              {profile.links.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {profile.links.slice(0, 6).map((link) => (
                    <li key={link.url}><a href={link.url} className="text-white/60 hover:text-white" rel="noreferrer noopener" target="_blank">{link.label}</a></li>
                  ))}
                </ul>
              ) : null}
              <Link to={`/markets/${encodeURIComponent(profile.providerAssetId)}`} className="mt-6 inline-flex text-sm text-white/70 hover:text-white">Open the coin page</Link>
            </div>
            <dl className="glass-soft h-fit divide-y divide-white/10 rounded-2xl px-5">
              <Fact label="Price" value={profile.price === null ? EMPTY_VALUE : formatMoney(profile.price, profile.currency)} />
              <Fact label="ATH" value={profile.ath === null ? 'Not available' : formatMoney(profile.ath, profile.currency)} />
              <Fact label="ATL" value={profile.atl === null ? 'Not available' : formatMoney(profile.atl, profile.currency)} />
              <Fact label="Market cap" value={compact(profile.marketCap, profile.currency)} />
              <Fact label="Volume" value={compact(profile.volume24h, profile.currency)} />
              <Fact label="Circulating supply" value={profile.circulatingSupply === null ? 'Not available' : formatAmount(profile.circulatingSupply)} />
              <Fact label="Total supply" value={profile.totalSupply === null ? 'Not available' : formatAmount(profile.totalSupply)} />
              <Fact label="Max supply" value={profile.maxSupply === null ? 'Not available' : formatAmount(profile.maxSupply)} />
              <Fact label="Blockchain" value={profile.platform ?? 'Not available'} />
              <Fact label="Contract" value={profile.contractAddress ?? 'Not available'} />
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setShown(true)
    }, { threshold: 0.2 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`landing-reveal ${shown ? 'is-in' : ''} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm text-white/45">{label}</dt>
      <dd className="text-right font-mono text-xs text-white">{value}</dd>
    </div>
  )
}

function quoteOf(row: MarketListing | undefined): TapeQuote | undefined {
  if (!row) return undefined
  return { price: row.price, currency: row.currency, change24hPercent: row.change24hPercent }
}

function tone(change: number | null | undefined) {
  if (change === null || change === undefined) return 'text-white/40'
  if (change > 0) return 'text-up'
  if (change < 0) return 'text-down'
  return 'text-white/40'
}

function percent(change: number | null | undefined) {
  if (change === null || change === undefined) return EMPTY_VALUE
  return formatPercent(change)
}

function money(value: number | null | undefined, currency: string | undefined) {
  if (value === null || value === undefined || !currency) return EMPTY_VALUE
  return formatMoney(value, currency)
}

function compact(value: number | null | undefined, currency: string | undefined) {
  if (value === null || value === undefined || !currency) return EMPTY_VALUE
  return formatCompact(value, currency)
}

function plainText(html: string) {
  const clean = sanitizeProviderHtml(html)
  return clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
