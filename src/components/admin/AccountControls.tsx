import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { SelectField, TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { adminSetAccountStatus, superAdminSetRole } from '@/services/adminOps'

export function AccountControls({
  userId,
  role,
  status,
  callerId,
  callerRole,
  configured,
  onSaved,
}: {
  userId: string
  role: string
  status: string
  callerId: string | null
  callerRole: string | null
  configured: boolean
  onSaved: () => void
}) {
  const { push } = useToast()
  const [note, setNote] = useState('')
  const [nextRole, setNextRole] = useState(role === 'admin' ? 'user' : 'admin')
  const [pending, setPending] = useState<'suspend' | 'reactivate' | 'role' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const noteReady = note.trim().length >= 3 && note.trim().length <= 280
  const self = callerId !== null && callerId === userId
  const superTarget = role === 'super_admin'
  const superCaller = callerRole === 'super_admin'
  const showStatus = !self && !superTarget && (callerRole === null || superCaller || role === 'user')
  const showRole = !self && !superTarget && (callerRole === null || superCaller)
  const canChangeStatus = configured && showStatus && (superCaller || role === 'user')
  const canChangeRole = configured && superCaller && !self && !superTarget

  async function confirm() {
    if (!pending || !noteReady) {
      setError('Enter a note between 3 and 280 characters.')
      setPending(null)
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (pending === 'role') {
        await superAdminSetRole(userId, nextRole === 'admin' ? 'admin' : 'user', note.trim())
      } else {
        await adminSetAccountStatus(userId, pending === 'suspend' ? 'suspended' : 'active', note.trim())
      }
      setNote('')
      setPending(null)
      onSaved()
      push({
        tone: 'success',
        title: pending === 'role' ? 'Role updated' : pending === 'suspend' ? 'Account suspended' : 'Account reactivated',
        description: 'The change was written with an audit log.',
      })
    } catch (reason) {
      setPending(null)
      setError(reason instanceof Error ? reason.message : 'The account was not changed.')
    } finally {
      setSaving(false)
    }
  }

  let blocked = ''
  if (self) blocked = 'You cannot change your own status or role.'
  else if (superTarget) blocked = 'A super administrator is not suspended or reassigned from this screen.'
  else if (callerRole === 'admin' && role !== 'user') blocked = 'An administrator can change training users. Only a super administrator can change another administrator.'
  else if (!configured) blocked = 'A configured administrator session is required before a status or role is saved.'

  const title = pending === 'suspend' ? 'Suspend account' : pending === 'reactivate' ? 'Reactivate account' : 'Change role'
  const body = pending === 'suspend'
    ? 'Suspend this training account. Existing balances and history stay in place.'
    : pending === 'reactivate'
      ? 'Reactivate this training account so the person can sign in again.'
      : `Change this role from ${role} to ${nextRole}. This cannot grant super administrator.`

  return (
    <div className="mt-4 space-y-3">
      {blocked ? <p className="text-xs text-muted">{blocked}</p> : null}
      {showStatus || showRole ? (
        <TextField id="account-note" label="Reason" value={note} onChange={(event) => setNote(event.target.value)} />
      ) : null}
      {error ? <p className="text-xs text-down" role="alert">{error}</p> : null}
      {showStatus ? (
        <div className="flex flex-wrap gap-2">
          {status === 'active' ? (
            <Button type="button" size="sm" variant="danger" disabled={!canChangeStatus || !noteReady || saving} onClick={() => setPending('suspend')}>
              Suspend
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={!canChangeStatus || !noteReady || saving} onClick={() => setPending('reactivate')}>
              Reactivate
            </Button>
          )}
        </div>
      ) : null}
      {showRole ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_auto] sm:items-end">
          <SelectField id="account-role" label="Role" value={nextRole} onChange={(event) => setNextRole(event.target.value)} disabled={!canChangeRole}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </SelectField>
          <Button type="button" size="sm" variant="secondary" disabled={!canChangeRole || !noteReady || saving || nextRole === role} onClick={() => setPending('role')}>
            Change role
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-muted">There is no control here to grant super administrator. Balance changes stay on the form below and are audited separately.</p>
      <ConfirmationModal
        open={pending !== null}
        title={title}
        body={body}
        confirmLabel={saving ? 'Saving...' : 'Confirm'}
        onConfirm={() => void confirm()}
        onClose={() => { if (!saving) setPending(null) }}
      />
    </div>
  )
}
