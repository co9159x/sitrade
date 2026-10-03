import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoLink } from '@/components/brand/Logo'
import { Button, buttonClass } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { useMarketDataStatus } from '@/hooks/useMarketDataStatus'
import { displayCurrencies } from '@/lib/currency'
import { paths } from '@/routes/paths'
import type { UserRole } from '@/types'

function adminRoleLabel(configured: boolean, role: UserRole | undefined) {
  if (!configured) return 'Preview · role checks off'
  if (role === 'super_admin') return 'Super admin'
  if (role === 'admin') return 'Admin'
  return 'Role unavailable'
}

export function TopNavigation({
  onMenu,
  tone,
}: {
  onMenu: () => void
  tone: 'user' | 'admin'
}) {
  const { configured, session, profile, signOut } = useAuth()
  const market = useMarketDataStatus()
  const { currency, setCurrency } = useDisplayCurrency()

  return (
    <header className="glass-soft flex h-14 shrink-0 items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-3 md:px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={onMenu}>
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="lg:hidden">
          <LogoLink compact />
        </div>
        <p className="hidden font-display text-sm tracking-[0.16em] text-muted sm:block">
          {tone === 'admin' ? 'Operations console' : 'Training desk'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="display-currency">Display currency</label>
        <select
          id="display-currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className="h-9 rounded-md border border-white/10 bg-white/5 px-3.5 font-mono text-sm text-text backdrop-blur-md"
        >
          {displayCurrencies.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
        {tone === 'user' ? (
          <p className="hidden rounded-md border border-line px-2 py-1 text-xs text-muted lg:block">
            {market.message}
          </p>
        ) : (
          <p className="hidden text-xs text-warn lg:block">{adminRoleLabel(configured, profile?.role)}</p>
        )}
        {session ? (
          <>
            <span className="hidden max-w-40 truncate text-xs text-muted sm:inline">
              {profile?.fullName || session.user.email}
            </span>
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </>
        ) : (
          <Link
            to={tone === 'admin' ? paths.adminLogin : paths.login}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
