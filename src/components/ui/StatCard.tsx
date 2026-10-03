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
    <article className="min-w-0 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <h2 className="truncate text-[11px] font-medium tracking-wide text-muted uppercase">{label}</h2>
      <p className="mt-1 font-mono text-lg leading-6 tabular-nums">{value}</p>
      {hint ? <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{hint}</p> : null}
    </article>
  )
}
