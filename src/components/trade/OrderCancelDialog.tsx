import { useState } from 'react'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useToast } from '@/context/ToastContext'
import type { DeskOrder } from '@/services/desk'
import { cancelSimulatedOrder } from '@/services/orders'
import { formatAmount } from '@/utils/format'

export function OrderCancelDialog({ order, onClose }: { order: DeskOrder | null; onClose: () => void }) {
  const { push } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    if (!order) return
    setSaving(true)
    setError(null)
    try {
      await cancelSimulatedOrder(order.id)
      push({ tone: 'success', title: 'Simulated order cancelled', description: 'The locked training balance was released.' })
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The order could not be cancelled.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfirmationModal
      open={order !== null}
      title="Cancel simulated order"
      body={order ? `Cancel the ${order.side} ${order.type} for ${formatAmount(order.amount)} on ${order.pair}. Locked funds return to the available balance. ${error ?? ''}` : ''}
      confirmLabel={saving ? 'Saving...' : 'Cancel order'}
      tone="danger"
      onConfirm={() => void confirm()}
      onClose={() => { if (!saving) onClose() }}
    />
  )
}
