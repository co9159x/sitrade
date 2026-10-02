import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'

const columns: TableColumn[] = [
  { key: 'asset', label: 'Asset' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'average', label: 'Average price', align: 'right' },
  { key: 'price', label: 'Current price', align: 'right' },
  { key: 'value', label: 'Value', align: 'right' },
  { key: 'pnl', label: 'P/L', align: 'right' },
  { key: 'change', label: '24h change', align: 'right' },
]

export function AssetTable({
  rows = [],
  emptyBody = 'Holdings are derived from the simulated wallet. Balances are not hardcoded.',
  loading = false,
}: {
  rows?: TableRow[]
  emptyBody?: string
  loading?: boolean
}) {
  return (
    <DataTable
      caption="Portfolio assets"
      columns={columns}
      rows={rows}
      emptyTitle="No holdings"
      emptyBody={emptyBody}
      loading={loading}
    />
  )
}
