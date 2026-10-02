import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'

const columns: TableColumn[] = [
  { key: 'id', label: 'Transaction ID' },
  { key: 'type', label: 'Type' },
  { key: 'asset', label: 'Asset' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
]

export function TransactionTable({
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
      caption="Transactions"
      columns={columns}
      rows={rows}
      emptyTitle="No transactions"
      emptyBody={emptyBody}
      loading={loading}
    />
  )
}
