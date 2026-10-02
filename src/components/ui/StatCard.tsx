export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <article className="border border-line bg-panel px-4 py-3 transition-colors hover:border-accent/50">
      <h2 className="font-display text-xs font-semibold tracking-[0.16em] text-muted uppercase">{label}</h2>
      <p className="mt-2 font-mono text-2xl tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </article>
  )
}
