import type { DeskNotification } from '@/services/desk'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/utils/format'

export function NotificationPanel({
  items = [],
  loading = false,
  emptyBody = 'Trade fills, deposits, withdrawals, and account alerts will appear here for the signed-in user.',
}: {
  items?: DeskNotification[]
  loading?: boolean
  emptyBody?: string
}) {
  return (
    <section className="rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-medium">Inbox</h2>
        <Button size="sm" variant="secondary" disabled>
          Mark all as read
        </Button>
      </div>
      {loading ? (
        <EmptyState title="Loading notifications" body="Reading this account’s inbox." />
      ) : items.length === 0 ? (
        <EmptyState title="No notifications" body={emptyBody} />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{item.title}</p>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-line' : 'bg-accent'}`} aria-hidden />
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
              <p className="mt-2 text-xs text-muted">{item.createdAt ? formatDateTime(item.createdAt) : ''}</p>
              <p className="sr-only">{item.read ? 'Read' : 'Unread'}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        Marking notifications as read is not available yet. The list is read from the account and is not changed from this screen.
      </p>
    </section>
  )
}
