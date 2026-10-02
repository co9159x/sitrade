import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { loadPlatformFees, superAdminSetFees } from '@/services/adminOps'

function percentText(rate: number) {
  return (rate * 100).toFixed(2)
}

function parsePercent(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed >= 100) return null
  return parsed / 100
}

export function FeeSettings({ configured, superAdmin }: { configured: boolean; superAdmin: boolean }) {
  const { push } = useToast()
  const [taker, setTaker] = useState('0.10')
  const [maker, setMaker] = useState('0.10')
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const takerRate = parsePercent(taker)
  const makerRate = parsePercent(maker)
  const noteReady = note.trim().length >= 3 && note.trim().length <= 280
  const canSave = configured && superAdmin && takerRate !== null && makerRate !== null && noteReady && !saving

  useEffect(() => {
    if (!configured || !superAdmin) return
    let active = true
    void loadPlatformFees().then((fees) => {
      if (!active || !fees) return
      setTaker(percentText(fees.taker))
      setMaker(percentText(fees.maker))
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [configured, superAdmin])

  async function confirm() {
    if (takerRate === null || makerRate === null || !noteReady) {
      setError('Enter fees from 0 up to, but not including, 100 percent, and a note of 3 to 280 characters.')
      setOpen(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await superAdminSetFees(takerRate, makerRate, note.trim())
      setNote('')
      setOpen(false)
      push({
        tone: 'success',
        title: 'Fees saved',
        description: 'Simulated fills use the taker rate. The maker rate is stored and audited. No market price was changed.',
      })
    } catch (reason) {
      setOpen(false)
      setError(reason instanceof Error ? reason.message : 'The fees were not saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="grid max-w-xl gap-4" onSubmit={(event) => { event.preventDefault(); if (canSave) setOpen(true) }}>
      <TextField
        id="fee-taker"
        label="Simulated taker fee (%)"
        value={taker}
        onChange={(event) => setTaker(event.target.value)}
        inputMode="decimal"
        hint="Used when a training order fills. 0.10 means 0.10 percent."
        error={taker !== '' && takerRate === null ? 'Enter a rate from 0 up to, but not including, 100.' : null}
      />
      <TextField
        id="fee-maker"
        label="Simulated maker fee (%)"
        value={maker}
        onChange={(event) => setMaker(event.target.value)}
        inputMode="decimal"
        hint="Stored for configuration. Current fills still use the taker rate."
        error={maker !== '' && makerRate === null ? 'Enter a rate from 0 up to, but not including, 100.' : null}
      />
      <TextField id="fee-note" label="Reason" value={note} onChange={(event) => setNote(event.target.value)} />
      {error ? <p className="text-xs text-down" role="alert">{error}</p> : null}
      <Button type="submit" disabled={!canSave}>
        {saving ? 'Saving...' : 'Save settings'}
      </Button>
      <p className="text-xs text-muted">
        {configured && superAdmin
          ? loaded
            ? 'Withdrawal fees are set on each asset. This form cannot grant super administrator.'
            : 'Withdrawal fees are set on each asset. Apply the latest database migration if these rates do not load.'
          : 'A normal administrator cannot save fees or promote anyone, including themselves.'}
      </p>
      <ConfirmationModal
        open={open}
        title="Save simulated fees"
        body="Update the stored training fee rates. This does not change completed trades."
        confirmLabel={saving ? 'Saving...' : 'Save fees'}
        tone="primary"
        onConfirm={() => void confirm()}
        onClose={() => { if (!saving) setOpen(false) }}
      />
    </form>
  )
}
