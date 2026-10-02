import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/hooks/useAuth'
import { paths } from '@/routes/paths'
import { validateEmail } from '@/utils/validation'

export function LoginPage() {
  useDocumentTitle('Sign in')
  const { signIn, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setFormMessage(null)
    const emailError = validateEmail(email)
    if (resetMode) {
      if (emailError) {
        setErrors({ email: emailError })
        return
      }
      setErrors({})
      setSubmitting(true)
      const result = await requestPasswordReset(email)
      setSubmitting(false)
      setFormError(result.error)
      setFormMessage(result.message)
      if (result.error) {
        toast.push({ tone: 'error', title: 'Reset was not sent', description: result.error })
      }
      return
    }

    const nextErrors: { email?: string; password?: string } = {}
    if (emailError) nextErrors.email = emailError
    if (!password) nextErrors.password = 'Enter your password.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const result = await signIn(email, password, remember)
    setSubmitting(false)
    if (result.error) {
      setFormError(result.error)
      toast.push({ tone: 'error', title: 'No session was created', description: result.error })
      return
    }
    const from = (location.state as { from?: string } | null)?.from
    navigate(from && from.startsWith('/') && !from.startsWith('//') ? from : paths.dashboard, { replace: true })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{resetMode ? 'Reset password' : 'Sign in'}</h1>
      <p className="mt-2 text-sm text-muted">
        {resetMode
          ? 'Request a reset link for this training account.'
          : 'Use the email and password for your training account.'}
      </p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {resetMode ? null : (
          <TextField
            id="login-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            error={errors.password}
            trailing={
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff className="h-4 w-4 text-muted" /> : <Eye className="h-4 w-4 text-muted" />}
              </button>
            }
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
        {resetMode ? null : (
          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Remember me on this device.</span>
          </label>
        )}
        {formMessage ? (
          <Notice tone="info" title="Check your email">
            {formMessage}
          </Notice>
        ) : null}
        {formError ? (
          <Notice tone="warning" title="Sign-in did not complete">
            {formError}
          </Notice>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Working…' : resetMode ? 'Request reset link' : 'Sign in'}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <button type="button" className="text-accent" onClick={() => { setResetMode((value) => !value); setFormError(null); setFormMessage(null); setErrors({}) }}>
          {resetMode ? 'Back to sign in' : 'Forgot password'}
        </button>
        <Link to={paths.register} className="text-muted">
          Create account
        </Link>
      </div>
    </div>
  )
}
