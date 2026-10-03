import { Link, Navigate, Outlet } from 'react-router-dom'
import { buttonClass } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'
import { isOperator } from '@/services/account'
import { paths } from '@/routes/paths'

export function AdminRoute() {
  const { configured, loading, profileLoading, session, profile } = useAuth()

  if (!configured) return <Outlet />
  if (loading || (session && profileLoading)) return <LoadingScreen label="Checking access" />
  if (!session) return <Navigate to={paths.adminLogin} replace />
  if (!profile || !isOperator(profile.role) || profile.status === 'suspended') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="font-display text-sm tracking-[0.16em] text-warn">ACCESS DENIED</p>
        <h1 className="mt-3 max-w-lg font-display text-4xl font-semibold tracking-tight">
          This account is not an administrator.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">
          The role is read from the database. Opening this address, or submitting the sign-in form, does not grant administrator access.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to={paths.home} className={buttonClass()}>
            Back to site
          </Link>
          <Link to={paths.adminLogin} className={buttonClass({ variant: 'secondary' })}>
            Admin sign in
          </Link>
        </div>
      </div>
    )
  }
  return <Outlet />
}
