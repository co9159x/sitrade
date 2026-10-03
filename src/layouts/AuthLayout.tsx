import { Link, Outlet } from 'react-router-dom'
import { LogoLink } from '@/components/brand/Logo'
import { DemoBanner } from '@/components/ui/DemoBanner'
import { SkipLink } from '@/components/ui/SkipLink'
import { paths } from '@/routes/paths'

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_32rem]">
      <SkipLink />
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 p-10 lg:flex">
        <img src="/hero/09.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/75 to-bg/35" />
        <div className="desk-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <LogoLink />
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-sm font-semibold tracking-[0.2em] text-warn">DEMO / TRAINING ENVIRONMENT</p>
          <p className="mt-3 font-display text-5xl leading-[0.9] font-semibold tracking-tight">TRAIN AGAINST LIVE PRICES. KEEP EVERY BALANCE SIMULATED.</p>
          <p className="mt-4 text-sm leading-6 text-muted">
            Sitrade is not an exchange. Deposits, withdrawals, orders, and portfolio values created here have no monetary value.
          </p>
        </div>
        <p className="relative text-xs text-muted">No bank, blockchain wallet, or real exchange is connected.</p>
      </section>
      <section className="flex min-h-dvh flex-col">
        <DemoBanner />
        <div className="flex items-center justify-between px-4 py-4 lg:hidden">
          <LogoLink />
          <Link to={paths.home} className="text-sm text-muted">
            Home
          </Link>
        </div>
        <main id="main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </section>
    </div>
  )
}
