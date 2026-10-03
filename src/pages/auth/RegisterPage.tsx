import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button, buttonClass } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { TextField } from '@/components/ui/TextField'
import { useToast } from '@/context/ToastContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/hooks/useAuth'
import { paths } from '@/routes/paths'
import { passwordRules, validateEmail, validateFullName, validatePassword } from '@/utils/validation'

export function RegisterPage() {
  useDocumentTitle('Create account')
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    const nameError = validateFullName(fullName)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (nameError) next.fullName = nameError
    if (emailError) next.email = emailError
    if (passwordError) next.password = passwordError
    if (password !== confirm) next.confirm = 'Passwords do not match.'
    if (!accepted) next.accepted = 'Accept the training terms to continue.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    const result = await signUp({ fullName, email, password })
    setSubmitting(false)
    setFormError(result.error)
    setFormMessage(result.message)
    if (result.error) {
      toast.push({ tone: 'error', title: 'No account was created', description: result.error })
      return
    }
    if (!result.message) navigate(paths.dashboard, { replace: true })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Create a training account</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Registration will store a profile and an empty simulated wallet. It does not open a real brokerage account.
      </p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
        <TextField id="register-name" label="Full name" autoComplete="name" value={fullName} error={errors.fullName} onChange={(event) => setFullName(event.target.value)} />
        <TextField id="register-email" label="Email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(event) => setEmail(event.target.value)} />
        <TextField
          id="register-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          error={errors.password}
          trailing={
            <button type="button" className={buttonClass({ variant: 'ghost', size: 'icon' })} aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff className="h-4 w-4 text-muted" /> : <Eye className="h-4 w-4 text-muted" />}
            </button>
          }
          onChange={(event) => setPassword(event.target.value)}
        />
        <ul className="space-y-1 text-xs text-muted">
          {passwordRules(password).map((rule) => (
            <li key={rule.label} className={rule.ok ? 'text-up' : undefined}>
              {rule.label}
            </li>
          ))}
        </ul>
        <TextField
          id="register-confirm"
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
        <div>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" className="mt-1" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>I understand Sitrade is a demo training environment. Balances and trades have no real monetary value.</span>
          </label>
          {errors.accepted ? <p className="mt-1 text-xs text-down">{errors.accepted}</p> : null}
        </div>
        {formMessage ? (
          <Notice tone="info" title="Confirm your email">
            {formMessage}
          </Notice>
        ) : null}
        {formError ? (
          <Notice tone="warning" title="No account was created">
            {formError}
          </Notice>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already registered?{' '}
        <Link to={paths.login} className="text-accent">
          Sign in
        </Link>
      </p>
    </div>
  )
}
