import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/utils/cn'
import { PageHeader } from '@/components/ui/PageHeader'

export function AppPage({
  title,
  description,
  notice,
  width = 'contained',
  children,
}: {
  title: string
  description: string
  notice?: ReactNode
  width?: 'contained' | 'full'
  children: ReactNode
}) {
  useDocumentTitle(title)

  return (
    <div className={cn('flex flex-col gap-4', width === 'contained' && 'mx-auto w-full max-w-7xl')}>
      <PageHeader title={title} description={description} />
      {notice}
      {children}
    </div>
  )
}
