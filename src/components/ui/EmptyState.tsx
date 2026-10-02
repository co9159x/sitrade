export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <svg viewBox="0 0 64 24" className="mx-auto mb-3 h-6 w-16" aria-hidden="true">
        <path d="M2 18h8V8H2zm12 0h8V4H14zm12 0h8v-6H26zm12 0h8V10H38z" className="fill-line" />
        <path d="M4 16 18 8l12 4 24-10" fill="none" className="stroke-accent" strokeWidth="1.5" />
      </svg>
      <p className="font-display text-lg tracking-wide">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted">{body}</p>
    </div>
  )
}
