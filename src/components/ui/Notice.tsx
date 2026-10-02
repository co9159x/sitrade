import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Notice({
  tone = 'warning',
  title,
  children,
}: {
  tone?: 'warning' | 'info'
  title: string
  children: ReactNode
}) {
  return (
    <aside
      className={cn(
        'rounded-lg border px-4 py-3',
        tone === 'warning' ? 'border-warn/40 bg-warn/10' : 'border-accent/40 bg-accent/10',
      )}
    >
      <p className={cn('font-display text-sm font-semibold tracking-[0.14em]', tone === 'warning' ? 'text-warn' : 'text-accent')}>
        {title}
      </p>
      <div className="mt-1 text-sm leading-6 text-text">{children}</div>
    </aside>
  )
}
