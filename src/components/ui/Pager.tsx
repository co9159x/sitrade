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
      <button
        type="button"
        className="h-9 rounded-md border border-line px-3 disabled:opacity-40"
        disabled={page <= 1}
        aria-label="Previous page"
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <p className="font-mono text-xs text-muted" aria-live="polite">
        Page {page} of {pageCount}
      </p>
      <button
        type="button"
        className="h-9 rounded-md border border-line px-3 disabled:opacity-40"
        disabled={page >= pageCount}
        aria-label="Next page"
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}
