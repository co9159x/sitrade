import { useMemo, useState } from 'react'
import { transactionRows } from '@/components/desk/rows'
import { TransactionTable } from '@/components/tables/TransactionTable'
import { AppPage } from '@/components/ui/AppPage'
import { Notice } from '@/components/ui/Notice'
import { Pager } from '@/components/ui/Pager'
import { SelectField, TextField } from '@/components/ui/TextField'
import { deskEmpty, useDesk } from '@/hooks/useDesk'

const pageSize = 8

export function TransactionsPage() {
  const desk = useDesk()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const filtering = query.trim() !== '' || type !== 'all' || from !== '' || to !== ''
  const needle = query.trim().toLowerCase()

  const filtered = useMemo(
    () =>
      desk.transactions.filter((row) => {
        if (type !== 'all' && row.type !== type) return false
        const day = row.createdAt.slice(0, 10)
        if (from && day < from) return false
        if (to && day > to) return false
        if (!needle) return true
        return row.id.toLowerCase().includes(needle) || row.type.includes(needle) || row.asset.toLowerCase().includes(needle)
      }),
    [desk.transactions, from, needle, to, type],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize)

  return (
    <AppPage
      title="Transactions"
      description="Ledger of simulated deposits, withdrawals, trades, fees, and administrator adjustments."
      notice={
        <>
          <Notice title="SIMULATED LEDGER">
            Records here have no monetary value. Search, type, and date filters apply to this account’s ledger.
          </Notice>
          {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextField
          id="tx-search"
          label="Search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
        />
        <SelectField
          id="tx-type"
          label="Type"
          value={type}
          onChange={(event) => {
            setType(event.target.value)
            setPage(1)
          }}
        >
          <option value="all">All types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="trade">Trade</option>
          <option value="fee">Fee</option>
          <option value="admin_adjustment">Admin adjustment</option>
        </SelectField>
        <TextField
          id="tx-from"
          label="From"
          type="date"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value)
            setPage(1)
          }}
        />
        <TextField
          id="tx-to"
          label="To"
          type="date"
          value={to}
          onChange={(event) => {
            setTo(event.target.value)
            setPage(1)
          }}
        />
      </div>
      <TransactionTable
        rows={transactionRows(visible)}
        loading={desk.status === 'loading'}
        emptyBody={deskEmpty(desk.status, filtering ? 'No transactions match these filters.' : 'No transactions yet.')}
      />
      <Pager page={current} pageCount={filtered.length === 0 ? 1 : pageCount} onPage={setPage} />
    </AppPage>
  )
}
