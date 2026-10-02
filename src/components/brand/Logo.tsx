import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="6" className="fill-panel-raised" />
        <path d="M5 7h9v18H5z" className="fill-accent" />
        <path d="M16 14h11v11H16z" className="fill-up" />
        <path d="M16 7h7v5h-7z" className="fill-text" />
      </svg>
      {compact ? null : (
        <span className="font-display text-xl leading-none font-semibold tracking-[0.14em]">SITRADE</span>
      )}
    </span>
  )
}

export function LogoLink({ to = '/', compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="rounded-md" aria-label="Sitrade home">
      <Logo compact={compact} />
    </Link>
  )
}
