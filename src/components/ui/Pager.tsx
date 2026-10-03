import { Button } from '@/components/ui/Button'

export function Pager({
  page,
  pageCount,
  onPage,
}: {
  page: number
  pageCount: number
  onPage: (page: number) => void
}) {
  if (pageCount <= 1) return null

  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pages">
      <Button type="button" variant="secondary" disabled={page <= 1} aria-label="Previous page" onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <p className="font-mono text-xs text-muted" aria-live="polite">
        Page {page} of {pageCount}
      </p>
      <Button type="button" variant="secondary" disabled={page >= pageCount} aria-label="Next page" onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </nav>
  )
}
