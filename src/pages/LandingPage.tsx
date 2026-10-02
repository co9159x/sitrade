import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { DeskArt } from '@/components/brand/DeskArt'
import { LogoLink } from '@/components/brand/Logo'
import { DemoBanner } from '@/components/ui/DemoBanner'
import { SkipLink } from '@/components/ui/SkipLink'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

const exampleAssets = [
  ['BTC', 'Bitcoin'],
  ['ETH', 'Ethereum'],
  ['SOL', 'Solana'],
  ['XRP', 'XRP'],
  ['ADA', 'Cardano'],
  ['DOGE', 'Dogecoin'],
  ['USDT', 'Tether'],
  ['BNB', 'BNB'],
  ['AVAX', 'Avalanche'],
  ['DOT', 'Polkadot'],
  ['LINK', 'Chainlink'],
]

const features = [
  ['01', 'Reference prices', 'Current price, 24 hour range, volume, and market cap come from a market data provider, not from invented numbers.'],
  ['02', 'Simulated orders', 'Market, limit, and stop orders update a training wallet. They are never sent to an exchange.'],
  ['03', 'Portfolio', 'Value and profit or loss are calculated from simulated holdings plus the latest reference price.'],
  ['04', 'Wallet activity', 'Deposits and withdrawals are application records. They cannot move real money or cryptocurrency.'],
  ['05', 'Separate operations console', 'Administrators use a different layout, login, and role check. A trader cannot open it by changing the address.'],
  ['06', 'Clear demo status', 'The training label stays visible on trading, wallet, portfolio, and transfer screens.'],
]

export function LandingPage() {
  useDocumentTitle('')
  const [open, setOpen] = useState(false)
  const tape = [...exampleAssets, ...exampleAssets]

  return (
    <div className="min-h-dvh bg-bg">
      <SkipLink />
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95">
        <DemoBanner />
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <LogoLink />
          <nav aria-label="Account" className="hidden items-center gap-2 sm:flex">
            <Link to={paths.login} className="inline-flex h-10 items-center px-3 text-sm text-muted transition-colors hover:text-text">
              Sign in
            </Link>
            <Link to={paths.register} className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong">
              Create account
            </Link>
          </nav>
          <button type="button" className="sm:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:hidden">
            <Link to={paths.login} className="py-2 text-sm" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link to={paths.register} className="py-2 text-sm" onClick={() => setOpen(false)}>
              Create account
            </Link>
          </div>
        ) : null}
      </header>

      <main id="main" tabIndex={-1}>
        <div className="overflow-hidden border-b border-line" aria-hidden="true">
          <div className="ticker-track flex w-max gap-8 py-2">
            {tape.map(([symbol, name], index) => (
              <span key={`${symbol}-${index}`} className="font-display text-sm tracking-[0.18em] text-muted">
                {symbol}
                <span className="ml-2 text-xs tracking-normal opacity-70">{name}</span>
              </span>
            ))}
          </div>
        </div>

        <section className="relative overflow-hidden">
          <div className="desk-grid pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div className="rise">
              <p className="font-display text-sm font-semibold tracking-[0.22em] text-warn">SIMULATED TRAINING PLATFORM</p>
              <h1 className="mt-3 max-w-xl font-display text-6xl leading-[0.88] font-semibold tracking-tight sm:text-7xl">
                TRADE THE TAPE.
                <span className="mt-1 block text-accent-soft">KEEP THE CASH SIMULATED.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted">
                Sitrade is a training desk for learning how an exchange is put together. Market information is real. Your money is not. Nothing on this platform can be withdrawn, redeemed, or sent on a blockchain.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to={paths.register} className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-strong">
                  Create a training account
                </Link>
                <Link to={paths.trade} className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm transition-colors hover:border-accent hover:text-accent">
                  Preview the terminal
                </Link>
              </div>
            </div>
            <DeskArt />
          </div>
        </section>

        <section className="border-y border-line bg-panel" aria-label="What is real">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
            <Fact index="01" title="Real market data" body="Prices, charts, and statistics are reference data from a market provider." />
            <Fact index="02" title="Simulated activity" body="Balances, orders, fees, deposits, and withdrawals exist only as application records." />
            <Fact index="03" title="No custody" body="Sitrade does not hold cryptocurrency or connect to a payment processor." />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <p className="font-display text-sm tracking-[0.2em] text-accent">PLATFORM</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">Two rooms. One rule.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Traders get a desk for markets, orders, and a simulated wallet. Operators get a separate console for users, assets, and an audit trail.
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {features.map(([index, title, body]) => (
              <article key={title} className="grid gap-2 py-4 sm:grid-cols-[4rem_14rem_minmax(0,1fr)] sm:items-baseline">
                <p className="font-display text-2xl text-accent">{index}</p>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-panel">
          <div className="mx-auto w-full max-w-6xl px-4 py-16">
            <p className="font-display text-sm tracking-[0.2em] text-accent">CATALOGUE</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">Example markets</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              These names illustrate the catalogue the desk is built to list. The actual assets are stored in the database and are not priced on this page.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {exampleAssets.map(([symbol, name]) => (
                <li key={symbol} className="group border border-line bg-bg px-4 py-4 transition-colors hover:border-accent">
                  <p className="font-display text-3xl leading-none tracking-wide transition-transform duration-300 group-hover:-translate-y-0.5">{symbol}</p>
                  <p className="mt-2 text-xs text-muted">{name}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2">
          <div>
            <p className="font-display text-sm tracking-[0.2em] text-accent">SESSION</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">How a training session works</h2>
            <ol className="mt-6 space-y-5">
              <Step n="01" title="Open a training account" body="Registration stores a profile and an empty simulated wallet. It does not start a balance with a hidden number in the interface." />
              <Step n="02" title="Read the market" body="Listed assets map to a provider identifier so prices, ranges, and candles stay tied to that asset." />
              <Step n="03" title="Place a simulated order" body="A fill updates the training wallet, fee, and ledger. No bitcoin is purchased and no exchange order is created." />
            </ol>
          </div>
          <div className="border border-line bg-panel p-6">
            <p className="font-display text-sm tracking-[0.2em] text-accent">ACCESS</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">Account safety</h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-muted">
              <li className="border-l-2 border-accent pl-3">Passwords are handled by the authentication service and are never stored in the interface.</li>
              <li className="border-l-2 border-line pl-3">Each trader is intended to read only their own wallet, orders, and notifications.</li>
              <li className="border-l-2 border-line pl-3">Administrator roles are assigned in the database. The client cannot submit a role and become an operator.</li>
              <li className="border-l-2 border-line pl-3">Identity verification is not part of this build.</li>
            </ul>
          </div>
        </section>

        <section className="border-y border-line bg-panel">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-16 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-sm tracking-[0.2em] text-warn">DEMO ENVIRONMENT</p>
              <h2 className="mt-2 max-w-xl font-display text-4xl font-semibold tracking-tight">Nothing here can be cashed out.</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
                Every deposit, withdrawal, balance, trade, fee, and portfolio value is simulated application data. When market data is connected, prices are live reference figures. A simulated buy still does not purchase cryptocurrency.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={paths.register} className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-strong">
                Create a training account
              </Link>
              <Link to={paths.login} className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm transition-colors hover:border-accent">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display tracking-[0.14em]">SITRADE — TRAINING ENVIRONMENT. NOT A FINANCIAL SERVICE.</p>
        <div className="flex gap-4">
          <Link to={paths.login} className="hover:text-text">Sign in</Link>
          <Link to={paths.register} className="hover:text-text">Register</Link>
        </div>
      </footer>
    </div>
  )
}

function Fact({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-display text-sm tracking-[0.16em] text-accent">{index}</p>
      <h2 className="mt-1 text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
    </div>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="font-display text-3xl leading-none text-accent">{n}</span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
      </div>
    </li>
  )
}
