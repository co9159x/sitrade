import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { adminCancelOrder } from '@/services/adminOps'

export function AdminOrderCancel({
  orderId,
  status,
  configured,
  onSaved,
}: {
  orderId: string
  status: string
  configured: boolean
  onSaved: () => void
}) {
  const { push } = useToast()
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const cancellable = status === 'open' || status === 'inactive'
  const noteReady = note.trim().length >= 3 && note.trim().length <= 280

  async function confirm() {
    if (!noteReady) {
      setError('Enter a note between 3 and 280 characters.')
      setOpen(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await adminCancelOrder(orderId, note.trim())
      setNote('')
      setOpen(false)
      onSaved()
      push({ tone: 'success', title: 'Order cancelled', description: 'The locked training balance was released. Filled history was not changed.' })
    } catch (reason) {
      setOpen(false)
      setError(reason instanceof Error ? reason.message : 'The order was not cancelled.')
    } finally {
      setSaving(false)
    }
  }

  if (!cancellable) {
    return <p className="mt-3 text-xs text-muted">Filled, cancelled, and rejected orders stay as history. This screen does not edit them.</p>
  }

  return (
    <div className="mt-4 space-y-3">
      <TextField id="order-cancel-note" label="Reason" value={note} onChange={(event) => setNote(event.target.value)} />
      {error ? <p className="text-xs text-down" role="alert">{error}</p> : null}
      <Button type="button" size="sm" variant="danger" disabled={!configured || !noteReady || saving} onClick={() => setOpen(true)}>
        Cancel open order
      </Button>
      <ConfirmationModal
        open={open}
        title="Cancel open order"
        body="Cancel this open training order and release the locked balance. Completed fills are left unchanged."
        confirmLabel={saving ? 'Saving...' : 'Cancel order'}
        onConfirm={() => void confirm()}
        onClose={() => { if (!saving) setOpen(false) }}
      />
    </div>
  )
}
