import type { ReactNode } from 'react'
import { DataTable, type TableColumn, type TableRow } from '@/components/ui/DataTable'

export function AdminTable({
  caption,
  columns,
  rows = [],
  emptyTitle,
  emptyBody,
  toolbar,
  loading = false,
}: {
  caption: string
  columns: TableColumn[]
  rows?: TableRow[]
  emptyTitle: string
  emptyBody: string
  toolbar?: ReactNode
  loading?: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <DataTable caption={caption} columns={columns} rows={rows} emptyTitle={emptyTitle} emptyBody={emptyBody} loading={loading} />
    </div>
  )
}
