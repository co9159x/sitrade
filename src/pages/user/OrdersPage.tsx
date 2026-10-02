import { useState } from 'react'
import { orderRows, ordersForTab } from '@/components/desk/rows'
import { OrderTable } from '@/components/tables/OrderTable'
import { OrderCancelDialog } from '@/components/trade/OrderCancelDialog'
import { AppPage } from '@/components/ui/AppPage'
import { Notice } from '@/components/ui/Notice'
import { Tabs } from '@/components/ui/Tabs'
import { deskEmpty, useDesk } from '@/hooks/useDesk'

const tabs = [
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function OrdersPage() {
  const desk = useDesk()
  const [tab, setTab] = useState('open')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const rows = ordersForTab(desk.orders, tab)
  const cancelOrder = desk.orders.find((order) => order.id === cancelId) ?? null

  return (
    <AppPage
      title="Orders"
      description="Simulated orders for this account. Open and waiting stop orders can be cancelled. Filled orders stay in the history."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <Tabs label="Order status" tabs={tabs} value={tab} onChange={setTab} />
      <OrderTable
        rows={orderRows(rows, (order) => setCancelId(order.id))}
        loading={desk.status === 'loading'}
        emptyBody={deskEmpty(
          desk.status,
          tab === 'open'
            ? 'No open simulated orders.'
            : tab === 'completed'
              ? 'No completed simulated orders.'
              : 'No cancelled simulated orders.',
        )}
      />
      <OrderCancelDialog order={cancelOrder} onClose={() => setCancelId(null)} />
    </AppPage>
  )
}
