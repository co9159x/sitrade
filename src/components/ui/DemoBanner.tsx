export function DemoBanner() {
  return (
    <div className="border-b border-warn/40 bg-[#16130c] px-4 py-2">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="inline-flex items-center gap-2 font-display text-sm font-semibold tracking-[0.16em] text-warn">
          <span className="demo-dot" aria-hidden="true" />
          DEMO / TRAINING ENVIRONMENT
        </span>
        <span className="text-xs text-[#f0e2c8]">
          Balances, trades, deposits, and withdrawals have no real monetary value.
        </span>
      </p>
    </div>
  )
}

export function PreviewRibbon({ children }: { children: string }) {
  return (
    <p className="border-b border-line bg-panel px-4 py-2 font-mono text-[11px] tracking-wide text-muted">{children}</p>
  )
}
