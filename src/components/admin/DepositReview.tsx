import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { adminReviewDeposit } from '@/services/wallet'

export function DepositReview({
  depositId,
  status,
  configured,
  onSaved,
}: {
  depositId: string
  status: string
  configured: boolean
  onSaved: () => void
}) {
  const { push } = useToast()
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const pending = status === 'pending'
  const noteReady = note.trim().length >= 3 && note.trim().length <= 280

  async function confirm() {
    if (!decision) return
    if (!noteReady) {
      setError('Enter a note between 3 and 280 characters.')
      setDecision(null)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await adminReviewDeposit(depositId, decision, note.trim())
      setNote('')
      setDecision(null)
      onSaved()
      push({
        tone: 'success',
        title: decision === 'approve' ? 'Deposit approved' : 'Deposit rejected',
        description: 'The review was written with an audit log.',
      })
    } catch (reason) {
      setDecision(null)
      setError(reason instanceof Error ? reason.message : 'The deposit was not reviewed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {pending ? (
        <>
          <TextField id="deposit-review-note" label="Review note" value={note} onChange={(event) => setNote(event.target.value)} />
          {error ? <p className="text-xs text-down" role="alert">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={!configured || !noteReady || saving} onClick={() => setDecision('approve')}>
              Approve
            </Button>
            <Button type="button" size="sm" variant="danger" disabled={!configured || !noteReady || saving} onClick={() => setDecision('reject')}>
              Reject
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted">Only a pending deposit can be approved or rejected. Completed deposits are already credited.</p>
      )}
      <ConfirmationModal
        open={decision !== null}
        title={decision === 'reject' ? 'Reject deposit' : 'Approve deposit'}
        body={decision === 'reject' ? 'Reject this pending training deposit. The balance will not change.' : 'Approve this pending training deposit and credit the simulated balance.'}
        confirmLabel={saving ? 'Saving...' : decision === 'reject' ? 'Reject deposit' : 'Approve deposit'}
        tone={decision === 'reject' ? 'danger' : 'primary'}
        onConfirm={() => void confirm()}
        onClose={() => { if (!saving) setDecision(null) }}
      />
    </div>
  )
}
