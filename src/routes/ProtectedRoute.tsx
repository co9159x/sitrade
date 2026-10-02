import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'
import { AccessMessage } from '@/routes/AccessMessage'
import { paths } from '@/routes/paths'

export function ProtectedRoute() {
  const { configured, loading, profileLoading, session, profile } = useAuth()
  const location = useLocation()

  if (!configured) return <Outlet />
  if (loading || (session && profileLoading)) return <LoadingScreen />
  if (!session) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  }
  if (profile?.status === 'suspended') {
    return (
      <AccessMessage
        title="This training account is suspended."
        body="A suspended account cannot open the desk. Nothing was changed from this screen."
      />
    )
  }
  if (!profile) {
    return (
      <AccessMessage
        title="This account has no profile yet."
        body="Sign-in succeeded, but the profile row is missing. Apply the database migration so registration can create a profile and an empty wallet."
      />
    )
  }
  return <Outlet />
}
