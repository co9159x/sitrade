import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, buttonClass } from '@/components/ui/Button'
import { DemoBanner } from '@/components/ui/DemoBanner'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/hooks/useAuth'
import { isOperator } from '@/services/account'
import { paths } from '@/routes/paths'
import { validateEmail } from '@/utils/validation'

export function AdminLoginPage() {
  useDocumentTitle('Operations sign in')
  const { signIn, session, profile } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextEmailError = validateEmail(email)
    setEmailError(nextEmailError)
    if (nextEmailError || !password) {
      setError(password ? null : 'Enter your password.')
      return
    }
    setSubmitting(true)
    const result = await signIn(email, password, true)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (!isOperator(result.role)) {
      setError('This account is not an administrator. Signing in did not change the role.')
      return
    }
    navigate(paths.adminDashboard, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="border-b-2 border-warn">
        <DemoBanner />
      </div>
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <p className="text-xs font-semibold tracking-wide text-warn">OPERATIONS CONSOLE</p>
        <h1 className="mt-2 text-2xl font-semibold">Administrator sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Access is decided by a database role. Submitting this form does not make an account an administrator.
        </p>
        {session && isOperator(profile?.role) ? (
          <Link to={paths.adminDashboard} className={buttonClass({ className: 'mt-6 bg-warn text-bg hover:brightness-110' })}>
            Continue to the operations console
          </Link>
        ) : null}
        <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
          <TextField id="admin-email" label="Email" type="email" autoComplete="username" value={email} error={emailError} onChange={(event) => setEmail(event.target.value)} />
          <TextField id="admin-password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error ? (
            <Notice tone="warning" title="Access was not granted">
              {error}
            </Notice>
          ) : null}
          <Button type="submit" className="w-full bg-warn text-bg hover:brightness-110" disabled={submitting}>
            {submitting ? 'Checking access…' : 'Continue'}
          </Button>
        </form>
        <Link to={paths.home} className={buttonClass({ variant: 'ghost', className: 'mt-6' })}>
          Back to the training site
        </Link>
      </main>
    </div>
  )
}
