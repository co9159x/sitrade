import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured, setRememberPreference } from '@/lib/supabase'
import { fetchProfile, isOperator } from '@/services/account'
import type { Profile, UserRole } from '@/types'

type SignUpInput = {
  fullName: string
  email: string
  password: string
}

export type AuthResult = {
  error: string | null
  message: string | null
  role: UserRole | null
}

type AuthContextValue = {
  configured: boolean
  loading: boolean
  profileLoading: boolean
  session: Session | null
  profile: Profile | null
  signIn: (email: string, password: string, remember?: boolean) => Promise<AuthResult>
  signUp: (input: SignUpInput) => Promise<AuthResult>
  requestPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const emptyResult = { message: null, role: null }

function authError(error: { message: string }) {
  return { error: error.message, ...emptyResult }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(configured)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    const next = await fetchProfile(userId)
    setProfile(next)
    setProfileLoading(false)
    return next
  }, [])

  useEffect(() => {
    if (!configured) return

    const supabase = getSupabase()
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        if (data.session) setProfileLoading(true)
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setSession(null)
        setLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      void event
      if (next) setProfileLoading(true)
      setSession(next)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [configured])

  useEffect(() => {
    if (!configured || !session) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)
    fetchProfile(session.user.id)
      .then((next) => {
        if (!active) return
        setProfile(next)
        setProfileLoading(false)
      })
      .catch(() => {
        if (!active) return
        setProfile(null)
        setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [configured, session])

  const signIn = useCallback(async (email: string, password: string, remember = true): Promise<AuthResult> => {
    if (!email.trim() || !password) {
      return { error: 'Enter your email and password.', ...emptyResult }
    }
    if (!configured) {
      return { error: 'Supabase is not configured. No session was created.', ...emptyResult }
    }

    setRememberPreference(remember)
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error || !data.user) return authError(error ?? { message: 'Sign-in failed. No session was created.' })

    const nextProfile = await loadProfile(data.user.id)
    if (nextProfile?.status === 'suspended') {
      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
      return { error: 'This training account is suspended.', ...emptyResult }
    }

    return { error: null, message: null, role: nextProfile?.role ?? null }
  }, [configured, loadProfile])

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult> => {
    if (!input.fullName.trim() || !input.email.trim() || !input.password) {
      return { error: 'Complete every field before continuing.', ...emptyResult }
    }
    if (!configured) {
      return { error: 'Supabase is not configured. No account was created.', ...emptyResult }
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { full_name: input.fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) return authError(error)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'An account with this email already exists. Sign in instead.', ...emptyResult }
    }
    if (!data.session) {
      return {
        error: null,
        message: 'Account created. Confirm the email, then sign in. A profile and an empty simulated wallet are stored for this account.',
        role: 'user',
      }
    }

    const nextProfile = await loadProfile(data.session.user.id)
    return { error: null, message: null, role: nextProfile?.role ?? 'user' }
  }, [configured, loadProfile])

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!email.trim()) return { error: 'Enter your email address.', ...emptyResult }
    if (!configured) {
      return { error: 'Supabase is not configured. No reset email was sent.', ...emptyResult }
    }

    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return authError(error)
    return {
      error: null,
      message: 'If an account exists for that email, a reset link has been sent.',
      role: null,
    }
  }, [configured])

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!configured) return { error: 'Supabase is not configured. The password was not changed.', ...emptyResult }
    const { error } = await getSupabase().auth.updateUser({ password })
    if (error) return authError(error)
    return { error: null, message: 'Password updated.', role: profile?.role ?? null }
  }, [configured, profile?.role])

  const signOut = useCallback(async () => {
    if (configured) {
      await getSupabase().auth.signOut()
    }
    setSession(null)
    setProfile(null)
  }, [configured])

  const value = useMemo(
    () => ({
      configured,
      loading,
      profileLoading,
      session,
      profile,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      signOut,
    }),
    [configured, loading, profileLoading, session, profile, signIn, signUp, requestPasswordReset, updatePassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}

export { isOperator }
