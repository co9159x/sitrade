import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function GlassPanel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn('glass-primary rounded-2xl', className)}>{children}</div>
}

export function GlassCard({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <article className={cn('glass-soft glass-card rounded-2xl', className)}>{children}</article>
}
