import { useState, type FormEvent } from 'react'
import { AppPage } from '@/components/ui/AppPage'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { SelectField, TextField } from '@/components/ui/TextField'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { displayCurrencies } from '@/lib/currency'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { validatePassword } from '@/utils/validation'

export function SettingsPage() {
  const { session, profile } = useAuth()
  const { currency, setCurrency } = useDisplayCurrency()

  return (
    <AppPage
      title="Settings"
      description="Profile, security, and display preferences. Profile fields are shown from the account. Password changes are saved to the account, and display currency is saved in this browser."
    >
      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-3 overflow-x-auto text-sm text-muted lg:flex-col">
          <a href="#profile" className="shrink-0 hover:text-text">Profile</a>
          <a href="#security" className="shrink-0 hover:text-text">Security</a>
          <a href="#preferences" className="shrink-0 hover:text-text">Preferences</a>
          <a href="#api" className="shrink-0 hover:text-text">API keys</a>
        </nav>
        <div className="space-y-8">
          <section id="profile" className="space-y-4">
            <h2 className="text-base font-semibold">Profile</h2>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line text-xs text-muted">
              {profile?.fullName ? profile.fullName.slice(0, 1).toUpperCase() : 'No image'}
            </div>
            <Button variant="secondary" disabled>
              Upload image
            </Button>
            <TextField id="settings-name" label="Name" disabled value={profile?.fullName ?? ''} placeholder="Available after a profile exists" />
            <TextField id="settings-email" label="Email" value={profile?.email ?? session?.user.email ?? ''} disabled readOnly placeholder="Available after sign-in" />
            <TextField id="settings-phone" label="Phone" disabled value={profile?.phone ?? ''} placeholder="Optional" />
            <p className="text-xs text-muted">Name, email, phone, and the profile image are displayed only. Editing them is not saved from this screen.</p>
          </section>
          <section id="security" className="space-y-4">
            <h2 className="text-base font-semibold">Security</h2>
            <PasswordChange />
            <div className="rounded-lg border border-line bg-panel p-4">
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="mt-1 text-xs text-muted">The switch is present for the settings layout and cannot be enabled in this build.</p>
              <button type="button" role="switch" aria-checked="false" disabled className="mt-3 h-6 w-11 rounded-full border border-line bg-bg opacity-50">
                <span className="sr-only">Two-factor authentication off</span>
              </button>
            </div>
            <p className="text-sm text-muted">Login history and active sessions are not stored in this build.</p>
          </section>
          <section id="preferences" className="space-y-4">
            <h2 className="text-base font-semibold">Preferences</h2>
            <SelectField id="settings-currency" label="Display currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {displayCurrencies.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </SelectField>
            <SelectField id="settings-language" label="Language" disabled>
              <option>English</option>
            </SelectField>
            <SelectField id="settings-theme" label="Theme" disabled>
              <option>Dark</option>
            </SelectField>
            <p className="text-xs text-muted">Display currency is saved in this browser and used for CoinGecko quotes. Language and theme stay fixed in this build.</p>
          </section>
          <section id="api" className="space-y-4">
            <h2 className="text-base font-semibold">Simulated API keys</h2>
            <Notice tone="info" title="Not an exchange key">
              Keys created here would be training credentials only. This build does not create real exchange API keys, and the action is disabled.
            </Notice>
            <Button variant="secondary" disabled>
              Create simulated key
            </Button>
          </section>
        </div>
      </div>
    </AppPage>
  )
}

function PasswordChange() {
  const { configured, session, updatePassword } = useAuth()
  const toast = useToast()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const signedIn = configured && Boolean(session)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const issue = validatePassword(next)
    if (issue) {
      setError(issue)
      return
    }
    if (next !== confirm) {
      setError('The passwords do not match.')
      return
    }
    setPending(true)
    const result = await updatePassword(next)
    setPending(false)
    if (result.error) {
      setError(result.error)
      toast.push({ tone: 'error', title: 'Password was not changed', description: result.error })
      return
    }
    setNext('')
    setConfirm('')
    setError(null)
    toast.push({ tone: 'success', title: 'Password updated', description: result.message ?? 'Your password was changed.' })
  }

  if (!signedIn) {
    return (
      <>
        <TextField id="settings-new-password" label="New password" type="password" disabled />
        <Button variant="secondary" disabled>
          Change password
        </Button>
        <p className="text-xs text-muted">Sign in with a configured account before changing the password. Nothing is stored from a disabled field.</p>
      </>
    )
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <TextField
        id="settings-new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        value={next}
        error={error}
        onChange={(event) => setNext(event.target.value)}
      />
      <TextField
        id="settings-confirm-password"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Updating...' : 'Change password'}
      </Button>
    </form>
  )
}
