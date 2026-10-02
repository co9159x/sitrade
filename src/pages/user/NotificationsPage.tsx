import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { AppPage } from '@/components/ui/AppPage'
import { Notice } from '@/components/ui/Notice'
import { deskEmpty, useDesk } from '@/hooks/useDesk'

export function NotificationsPage() {
  const desk = useDesk()

  return (
    <AppPage
      title="Notifications"
      description="Fills, deposits, withdrawals, and account alerts for this training account."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <NotificationPanel
        items={desk.notifications}
        loading={desk.status === 'loading'}
        emptyBody={deskEmpty(desk.status, 'Trade fills, deposits, withdrawals, and account alerts will appear here.')}
      />
    </AppPage>
  )
}
