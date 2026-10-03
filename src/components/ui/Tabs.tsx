import { useRef } from 'react'

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
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function move(index: number, key: string) {
    let next = index
    if (key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (key === 'Home') next = 0
    else if (key === 'End') next = tabs.length - 1
    else return
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(node) => { refs.current[index] = node }}
            type="button"
            role="tab"
            id={`tab-${label.replace(/\s+/g, '-')}-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`inline-flex h-9 shrink-0 items-center justify-center rounded-md px-3.5 text-sm font-medium ${
              selected ? 'border border-white/10 bg-white/5 text-text' : 'text-muted hover:bg-white/5 hover:text-text'
            }`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') {
                event.preventDefault()
                move(index, event.key)
              }
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
