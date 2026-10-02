import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'

const columns: TableColumn[] = [
  { key: 'pair', label: 'Trading pair' },
  { key: 'type', label: 'Type' },
  { key: 'side', label: 'Side' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'filled', label: 'Filled', align: 'right' },
  { key: 'remaining', label: 'Remaining', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'fee', label: 'Fee', align: 'right' },
  { key: 'date', label: 'Date' },
  { key: 'action', label: 'Action' },
]

export function OrderTable({
  rows = [],
  emptyBody,
  loading = false,
}: {
  rows?: TableRow[]
  emptyBody: string
  loading?: boolean
}) {
  return (
    <DataTable
      caption="Orders"
      columns={columns}
      rows={rows}
      emptyTitle="No orders"
      emptyBody={emptyBody}
      loading={loading}
    />
  )
}
