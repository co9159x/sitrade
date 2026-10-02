export function Tabs({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string
  tabs: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`h-9 shrink-0 rounded-md px-3 text-xs font-medium ${
              selected ? 'bg-panel-raised text-text' : 'text-muted hover:text-text'
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
