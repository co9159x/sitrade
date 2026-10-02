export function ActivityBars({ dates, empty }: { dates: string[]; empty: string }) {
  const days = 14
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const keys: string[] = []
  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(start)
    day.setDate(day.getDate() - index)
    keys.push(day.toISOString().slice(0, 10))
  }
  const counts = new Map(keys.map((key) => [key, 0]))
  for (const iso of dates) {
    const key = iso.slice(0, 10)
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const values = keys.map((key) => counts.get(key) ?? 0)
  const max = Math.max(...values)

  if (max === 0) {
    return <p className="mt-2 text-sm text-muted">{empty}</p>
  }

  return (
    <div className="mt-4 flex h-24 items-end gap-1" aria-hidden="true">
      {values.map((value, index) => (
        <div key={keys[index]} className="flex h-full flex-1 items-end">
          <div
            className="w-full rounded-sm bg-warn/80"
            style={{ height: value === 0 ? '0%' : `${(value / max) * 100}%` }}
            title={`${keys[index]}: ${value}`}
          />
        </div>
      ))}
    </div>
  )
}
