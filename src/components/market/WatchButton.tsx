import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useDesk } from '@/hooks/useDesk'
import { setWatchlisted } from '@/services/desk'

export function WatchButton({ symbol }: { symbol: string }) {
  const desk = useDesk()
  const asset = desk.assets.find((item) => item.symbol === symbol)
  const saved = asset ? desk.watchlist.some((item) => item.assetId === asset.id) : false
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        size="small"
        variant={saved ? 'secondary' : 'ghost'}
        disabled={!asset || desk.status !== 'ready' || busy}
        title={asset ? 'Save this catalogue asset on the account watchlist' : 'Only assets in the simulated trading catalogue can be saved'}
        onClick={() => {
          if (!asset) return
          setBusy(true)
          setError(null)
          setWatchlisted(asset.id, saved)
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The watchlist could not be updated.'))
            .finally(() => setBusy(false))
        }}
      >
        {saved ? 'Saved' : 'Watchlist'}
      </Button>
      {error ? <span className="text-xs text-down">{error}</span> : null}
    </span>
  )
}
