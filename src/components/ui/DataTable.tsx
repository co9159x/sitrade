import type { ReactNode } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'

export type TableColumn = {
  key: string
  label: string
  align?: 'left' | 'right'
}

export type TableRow = {
  id: string
  cells: Record<string, ReactNode>
}

export function DataTable({
  caption,
  columns,
  rows,
  emptyTitle,
  emptyBody,
  loading = false,
}: {
  caption: string
  columns: TableColumn[]
  rows: TableRow[]
  emptyTitle: string
  emptyBody: string
  loading?: boolean
}) {
  const title = loading ? 'Loading records' : emptyTitle
  const body = loading ? 'Reading this account from the database.' : emptyBody
  const visibleRows = loading ? [] : rows
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 font-medium ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={title} body={body} />
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 ${column.align === 'right' ? 'text-right font-mono tabular-nums' : ''}`}
                    >
                      {row.cells[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="md:hidden">
        {visibleRows.length === 0 ? (
          <EmptyState title={title} body={body} />
        ) : (
          <ul className="divide-y divide-line">
            {visibleRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-xs text-muted">{column.label}</span>
                    <span className="text-right">{row.cells[column.key]}</span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
