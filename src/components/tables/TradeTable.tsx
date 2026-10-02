import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'

const columns: TableColumn[] = [
  { key: 'pair', label: 'Pair' },
  { key: 'side', label: 'Side' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'fee', label: 'Fee', align: 'right' },
  { key: 'date', label: 'Date' },
]

export function TradeTable({
  rows,
  emptyBody,
  loading = false,
}: {
  rows: TableRow[]
  emptyBody: string
  loading?: boolean
}) {
  return (
    <DataTable
      caption="Simulated trades"
      columns={columns}
      rows={rows}
      emptyTitle="No simulated trades"
      emptyBody={emptyBody}
      loading={loading}
    />
  )
}
