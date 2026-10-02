import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { adminReviewWithdrawal } from '@/services/wallet'

export function WithdrawalReview({
  withdrawalId,
  status,
  configured,
  onSaved,
}: {
  withdrawalId: string
  status: string
  configured: boolean
  onSaved: () => void
}) {
  const { push } = useToast()
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<'processing' | 'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const open = status === 'pending' || status === 'processing'
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
      await adminReviewWithdrawal(withdrawalId, decision, note.trim())
      setNote('')
      setDecision(null)
      onSaved()
      push({
        tone: 'success',
        title: decision === 'approve' ? 'Withdrawal completed' : decision === 'reject' ? 'Withdrawal rejected' : 'Withdrawal processing',
        description: 'The review was written with an audit log. No blockchain transaction was created.',
      })
    } catch (reason) {
      setDecision(null)
      setError(reason instanceof Error ? reason.message : 'The withdrawal was not reviewed.')
    } finally {
      setSaving(false)
    }
  }

  const title = decision === 'reject' ? 'Reject withdrawal' : decision === 'processing' ? 'Mark withdrawal processing' : 'Complete withdrawal'
  const body = decision === 'reject'
    ? 'Reject this training withdrawal and release the locked balance. Nothing is sent to a network.'
    : decision === 'processing'
      ? 'Mark this training withdrawal as processing. The balance stays locked.'
      : 'Mark this training withdrawal completed and remove the locked balance. No blockchain transaction is created.'

  return (
    <div className="mt-4 space-y-3">
      {open ? (
        <>
          <TextField id="withdrawal-review-note" label="Review note" value={note} onChange={(event) => setNote(event.target.value)} />
          {error ? <p className="text-xs text-down" role="alert">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            {status === 'pending' ? (
              <Button type="button" size="sm" variant="secondary" disabled={!configured || !noteReady || saving} onClick={() => setDecision('processing')}>
                Mark processing
              </Button>
            ) : null}
            <Button type="button" size="sm" disabled={!configured || !noteReady || saving} onClick={() => setDecision('approve')}>
              Complete
            </Button>
            <Button type="button" size="sm" variant="danger" disabled={!configured || !noteReady || saving} onClick={() => setDecision('reject')}>
              Reject
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted">Completed and rejected withdrawals stay in the record. The locked balance is not changed again.</p>
      )}
      <ConfirmationModal
        open={decision !== null}
        title={title}
        body={body}
        confirmLabel={saving ? 'Saving...' : decision === 'reject' ? 'Reject withdrawal' : decision === 'processing' ? 'Mark processing' : 'Complete withdrawal'}
        tone={decision === 'reject' ? 'danger' : 'primary'}
        onConfirm={() => void confirm()}
        onClose={() => { if (!saving) setDecision(null) }}
      />
    </div>
  )
}
