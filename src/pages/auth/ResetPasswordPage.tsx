import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/hooks/useAuth'
import { paths } from '@/routes/paths'
import { validatePassword } from '@/utils/validation'

export function ResetPasswordPage() {
  useDocumentTitle('Reset password')
  const { configured, session, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)
    setError(result.error)
    setMessage(result.message)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        This updates the training account only. It does not change a password on any exchange.
      </p>
      {!configured || !session ? (
        <div className="mt-6">
          <Notice tone="warning" title="Reset link required">
            Open the link from the reset email in this browser. No password was changed.
          </Notice>
          <Link to={paths.login} className={buttonClass({ variant: 'secondary', className: 'mt-4' })}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
          <TextField id="reset-password" label="New password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <TextField id="reset-confirm" label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          {message ? <Notice tone="info" title="Password updated">{message}</Notice> : null}
          {error ? <Notice tone="warning" title="Password was not changed">{error}</Notice> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </div>
  )
}
