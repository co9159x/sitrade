import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AccountControls } from '@/components/admin/AccountControls'
import { ActivityBars } from '@/components/admin/ActivityBars'
import { AdminOrderCancel } from '@/components/admin/AdminOrderCancel'
import { AssetControls } from '@/components/admin/AssetControls'
import { BalanceAdjust } from '@/components/admin/BalanceAdjust'
import { DepositReview } from '@/components/admin/DepositReview'
import { FeeSettings } from '@/components/admin/FeeSettings'
import { WithdrawalReview } from '@/components/admin/WithdrawalReview'
import { AdminTable } from '@/components/tables/AdminTable'
import { AppPage } from '@/components/ui/AppPage'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Pager } from '@/components/ui/Pager'
import { SelectField, TextField } from '@/components/ui/TextField'
import { StatCard } from '@/components/ui/StatCard'
import type { TableRow } from '@/components/ui/DataTable'
import { adminEmpty, useAdminDesk } from '@/hooks/useAdminDesk'
import { useAuth } from '@/hooks/useAuth'
import { paths } from '@/routes/paths'
import type { AdminAsset, AdminPair, AdminProfile } from '@/services/adminDesk'
import { EMPTY_VALUE, formatAmount, formatDateTime, labelize } from '@/utils/format'

const pageSize = 8

function countLabel(ready: boolean, value: number) {
  return ready ? String(value) : EMPTY_VALUE
}

function person(profiles: AdminProfile[], id: string) {
  const profile = profiles.find((item) => item.id === id)
  if (!profile) return id ? id.slice(0, 8) : EMPTY_VALUE
  return profile.email || profile.fullName || profile.id.slice(0, 8)
}

function when(iso: string) {
  return iso ? formatDateTime(iso) : EMPTY_VALUE
}

function flag(on: boolean) {
  return <span className={on ? 'text-up' : 'text-muted'}>{on ? 'On' : 'Off'}</span>
}

function assetMark(assets: AdminAsset[], symbol: string) {
  if (!symbol) return EMPTY_VALUE
  const asset = assets.find((item) => item.symbol === symbol)
  return asset && !asset.listed ? `${symbol} · delisted` : symbol
}

function pairMark(assets: AdminAsset[], pairs: AdminPair[], symbol: string) {
  if (!symbol) return EMPTY_VALUE
  const pair = pairs.find((item) => item.symbol === symbol)
  if (!pair) return symbol
  const closed = [pair.baseAssetId, pair.quoteAssetId].some((id) => assets.some((asset) => asset.id === id && !asset.listed))
  return closed ? `${symbol} · delisted` : symbol
}

function matches(query: string, parts: string[]) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return parts.some((part) => part.toLowerCase().includes(needle))
}

function usePage(length: number) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(length / pageSize))
  const current = Math.min(page, pageCount)
  return { page: current, pageCount: length === 0 ? 1 : pageCount, setPage, start: (current - 1) * pageSize }
}

export function AdminDashboardPage() {
  const desk = useAdminDesk()
  const ready = desk.status === 'ready'
  const openOrders = desk.orders.filter((order) => order.status === 'open' || order.status === 'partially_filled' || order.status === 'inactive')
  const activeUsers = desk.profiles.filter((profile) => profile.status === 'active')
  const listed = desk.assets.filter((asset) => asset.listed)
  const volume = desk.trades.reduce((sum, trade) => sum + trade.price * trade.amount, 0)

  return (
    <AppPage
      title="Operations overview"
      description="Platform activity inside Sitrade. These figures are simulated records, not real-world exchange statistics."
      notice={
        <>
          <Notice title="SIMULATED PLATFORM TOTALS">
            Trading volume on this console is the sum of training fills. It is not market volume from the price provider.
          </Notice>
          {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Registered users" value={countLabel(ready, desk.profiles.length)} hint="Accounts stored in the database." />
        <StatCard label="Active users" value={countLabel(ready, activeUsers.length)} hint="Accounts that are not suspended." />
        <StatCard label="Simulated deposits" value={countLabel(ready, desk.deposits.length)} hint="Count of training deposits. Amounts are not added across assets." />
        <StatCard label="Simulated withdrawals" value={countLabel(ready, desk.withdrawals.length)} hint="Count of training withdrawals. No funds are sent." />
        <StatCard
          label="Simulated trading volume"
          value={ready && desk.trades.length > 0 ? formatAmount(volume) : ready ? '0' : EMPTY_VALUE}
          hint="Sum of fill price × amount in each pair’s quote currency. Not exchange volume."
        />
        <StatCard label="Demo balance" value={EMPTY_VALUE} hint="Wallet quantities are not added across assets, and quote value needs reference prices." />
        <StatCard label="Listed assets" value={countLabel(ready, listed.length)} hint="Assets visible in market discovery." />
        <StatCard label="Open orders" value={countLabel(ready, openOrders.length)} hint="Simulated orders still working." />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border border-line bg-panel p-4">
          <h2 className="text-sm font-medium">User growth</h2>
          <p className="mt-1 text-xs text-muted">Registrations over the last 14 days.</p>
          <ActivityBars dates={desk.profiles.map((profile) => profile.createdAt)} empty={adminEmpty(desk.status, 'No registrations in this window.')} />
        </section>
        <section className="rounded-lg border border-line bg-panel p-4">
          <h2 className="text-sm font-medium">Simulated trading volume</h2>
          <p className="mt-1 text-xs text-muted">Platform fills per day. Not market volume.</p>
          <ActivityBars dates={desk.trades.map((trade) => trade.createdAt)} empty={adminEmpty(desk.status, 'No simulated fills in this window.')} />
        </section>
        <section className="rounded-lg border border-line bg-panel p-4">
          <h2 className="text-sm font-medium">Simulated deposits</h2>
          <ActivityBars dates={desk.deposits.map((row) => row.createdAt)} empty={adminEmpty(desk.status, 'No simulated deposits in this window.')} />
        </section>
        <section className="rounded-lg border border-line bg-panel p-4">
          <h2 className="text-sm font-medium">Simulated withdrawals</h2>
          <ActivityBars dates={desk.withdrawals.map((row) => row.createdAt)} empty={adminEmpty(desk.status, 'No simulated withdrawals in this window.')} />
        </section>
      </div>
      <section>
        <h2 className="mb-2 text-sm font-medium">Recent activity</h2>
        <AdminTable
          caption="Recent ledger activity"
          columns={[
            { key: 'user', label: 'User' },
            { key: 'type', label: 'Type' },
            { key: 'asset', label: 'Asset' },
            { key: 'amount', label: 'Amount', align: 'right' },
            { key: 'date', label: 'Date' },
          ]}
          rows={desk.ledger.slice(0, 8).map((row) => ({
            id: row.id,
            cells: {
              user: person(desk.profiles, row.userId),
              type: labelize(row.type),
              asset: assetMark(desk.assets, row.symbol),
              amount: formatAmount(row.amount),
              date: when(row.createdAt),
            },
          }))}
          loading={desk.status === 'loading'}
          emptyTitle="No activity"
          emptyBody={adminEmpty(desk.status, 'Ledger entries will appear here as training activity is stored.')}
        />
      </section>
    </AppPage>
  )
}

export function AdminUsersPage() {
  const desk = useAdminDesk()
  const { configured, profile } = useAuth()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const lastActivity = useMemo(() => {
    const stamps = new Map<string, string>()
    for (const row of [...desk.ledger, ...desk.orders, ...desk.trades]) {
      const current = stamps.get(row.userId)
      if (!current || row.createdAt > current) stamps.set(row.userId, row.createdAt)
    }
    return stamps
  }, [desk.ledger, desk.orders, desk.trades])
  const filtered = desk.profiles.filter((profile) => matches(query, [profile.id, profile.fullName, profile.email, profile.status, profile.role]))
  const paging = usePage(filtered.length)
  const rows: TableRow[] = filtered.slice(paging.start, paging.start + pageSize).map((profile) => ({
    id: profile.id,
    cells: {
      id: <span className="font-mono text-xs">{profile.id.slice(0, 8)}</span>,
      name: profile.fullName || EMPTY_VALUE,
      email: profile.email || EMPTY_VALUE,
      status: labelize(profile.status),
      role: labelize(profile.role),
      balance: EMPTY_VALUE,
      registered: when(profile.createdAt),
      activity: when(lastActivity.get(profile.id) ?? profile.updatedAt),
      view: (
        <Button type="button" size="compact" variant="ghost" onClick={() => setSelected(profile.id)}>
          View
        </Button>
      ),
    },
  }))
  const user = desk.profiles.find((profile) => profile.id === selected) ?? null
  const balances = desk.balances.filter((row) => row.userId === user?.id)

  return (
    <AppPage
      title="Users"
      description="Training accounts. Passwords are never loaded. Suspension, reactivation, role changes, and balance adjustments are audited."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          <TextField id="users-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
        </div>
        <p className="text-xs text-muted">Open a user to change status or adjust a simulated balance.</p>
      </div>
      <AdminTable
        caption="Users"
        columns={[
          { key: 'id', label: 'User ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status' },
          { key: 'role', label: 'Role' },
          { key: 'balance', label: 'Balance', align: 'right' },
          { key: 'registered', label: 'Registered' },
          { key: 'activity', label: 'Last activity' },
          { key: 'view', label: 'Record' },
        ]}
        rows={rows}
        loading={desk.status === 'loading'}
        emptyTitle={query.trim() ? `No matches for “${query.trim()}”` : 'No users'}
        emptyBody={adminEmpty(desk.status, 'Registration has not created any profiles yet.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
      {user ? (
        <section className="rounded-lg border border-line bg-panel p-4">
          <h2 className="text-sm font-medium">{user.fullName || user.email}</h2>
          <p className="mt-1 text-xs text-muted">{user.email} · {labelize(user.role)} · {labelize(user.status)}</p>
          <p className="mt-3 text-xs text-muted">Wallet quantities are listed separately. They are not converted to a single balance.</p>
          {balances.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No balance rows.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {balances.map((row) => (
                <li key={row.id} className="font-mono">
                  {row.symbol} · available {formatAmount(row.available)} · locked {formatAmount(row.locked)}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link className="text-warn" to={`${paths.adminTransactions}?user=${user.id}`}>Ledger</Link>
            <Link className="text-warn" to={`${paths.adminTrades}?user=${user.id}`}>Trades</Link>
            <Link className="text-warn" to={`${paths.adminDeposits}?user=${user.id}`}>Deposits</Link>
            <Link className="text-warn" to={`${paths.adminWithdrawals}?user=${user.id}`}>Withdrawals</Link>
          </div>
          <AccountControls
            key={user.id}
            userId={user.id}
            role={user.role}
            status={user.status}
            callerId={profile?.id ?? null}
            callerRole={profile?.role ?? null}
            configured={configured && desk.status === 'ready'}
            onSaved={desk.reload}
          />
          <div className="mt-4">
            <BalanceAdjust
              userId={user.id}
              userLabel={user.email || user.fullName || user.id.slice(0, 8)}
              assets={desk.assets}
              configured={configured && desk.status === 'ready'}
              onSaved={desk.reload}
            />
          </div>
        </section>
      ) : null}
    </AppPage>
  )
}

export function AdminAssetsPage() {
  const desk = useAdminDesk()
  const { configured } = useAuth()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const filtered = desk.assets.filter((asset) => matches(query, [asset.symbol, asset.name, asset.providerAssetId]))
  const paging = usePage(filtered.length)
  const rows: TableRow[] = filtered.slice(paging.start, paging.start + pageSize).map((asset) => ({
    id: asset.id,
    cells: {
      symbol: asset.symbol,
      name: asset.name,
      provider: asset.providerAssetId,
      listed: flag(asset.listed),
      trading: flag(asset.tradingEnabled),
      deposits: flag(asset.depositsEnabled),
      withdrawals: flag(asset.withdrawalsEnabled),
      view: (
        <Button type="button" size="compact" variant="ghost" onClick={() => setSelected(asset.id)}>
          View
        </Button>
      ),
    },
  }))
  const asset = desk.assets.find((item) => item.id === selected) ?? null
  const pairs = desk.pairs.filter((pair) => pair.baseAssetId === asset?.id || pair.quoteAssetId === asset?.id)

  return (
    <AppPage
      title="Assets"
      description="Catalogue flags for listing, trading, deposits, and withdrawals. Price overrides are not part of this screen."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          <TextField id="assets-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
        </div>
        <Button variant="secondary" disabled title="New symbols are added in the database catalogue.">
          Add asset
        </Button>
      </div>
      <AdminTable
        caption="Assets"
        columns={[
          { key: 'symbol', label: 'Symbol' },
          { key: 'name', label: 'Name' },
          { key: 'provider', label: 'Provider ID' },
          { key: 'listed', label: 'Listed' },
          { key: 'trading', label: 'Trading' },
          { key: 'deposits', label: 'Deposits' },
          { key: 'withdrawals', label: 'Withdrawals' },
          { key: 'view', label: 'Record' },
        ]}
        rows={rows}
        loading={desk.status === 'loading'}
        emptyTitle={query.trim() ? `No matches for “${query.trim()}”` : 'No assets'}
        emptyBody={adminEmpty(desk.status, 'The asset catalogue is empty.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
      {asset ? (
        <section className="rounded-lg border border-line bg-panel p-4 text-sm">
          <h2 className="font-medium">{asset.symbol} · {asset.name}</h2>
          <p className="mt-2 text-muted">Provider ID {asset.providerAssetId}. Quote {asset.quoteCurrency}.</p>
          <p className="mt-1 text-muted">Minimum order {formatAmount(asset.minOrder)}. Simulated withdrawal fee {formatAmount(asset.withdrawalFee)}.</p>
          <p className="mt-3 text-xs text-muted">{pairs.length === 0 ? 'No trading pairs use this asset.' : pairs.map((pair) => pair.symbol).join(', ')}</p>
          <AssetControls
            key={asset.id}
            assetId={asset.id}
            listed={asset.listed}
            tradingEnabled={asset.tradingEnabled}
            depositsEnabled={asset.depositsEnabled}
            withdrawalsEnabled={asset.withdrawalsEnabled}
            minOrder={asset.minOrder}
            withdrawalFee={asset.withdrawalFee}
            configured={configured && desk.status === 'ready'}
            onSaved={desk.reload}
          />
        </section>
      ) : null}
    </AppPage>
  )
}

function StatusFilter({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <SelectField id={id} label="Status" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="all">All statuses</option>
      <option value="pending">Pending</option>
      <option value="processing">Processing</option>
      <option value="completed">Completed</option>
      <option value="rejected">Rejected</option>
      <option value="cancelled">Cancelled</option>
    </SelectField>
  )
}

export function AdminDepositsPage() {
  const desk = useAdminDesk()
  const { configured } = useAuth()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('user') ?? '')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)
  const filtered = desk.deposits.filter((row) => (status === 'all' || row.status === status) && matches(query, [row.id, row.userId, person(desk.profiles, row.userId), row.symbol, row.status]))
  const paging = usePage(filtered.length)
  const deposit = desk.deposits.find((row) => row.id === selected) ?? null

  return (
    <AppPage
      title="Deposits"
      description="Simulated deposits. A user deposit is credited immediately. Pending deposits can be approved or rejected with an audit log."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <TextField id="deposits-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
        <StatusFilter id="deposits-status" value={status} onChange={(value) => { setStatus(value); paging.setPage(1) }} />
      </div>
      <AdminTable
        caption="Deposits"
        columns={[
          { key: 'user', label: 'User' },
          { key: 'currency', label: 'Currency' },
          { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Date' },
          { key: 'view', label: 'Record' },
        ]}
        rows={filtered.slice(paging.start, paging.start + pageSize).map((row) => ({
          id: row.id,
          cells: {
            user: person(desk.profiles, row.userId),
            currency: assetMark(desk.assets, row.symbol),
            amount: formatAmount(row.amount),
            status: labelize(row.status),
            date: when(row.createdAt),
            view: <Button type="button" size="compact" variant="ghost" onClick={() => setSelected(row.id)}>View</Button>,
          },
        }))}
        loading={desk.status === 'loading'}
        emptyTitle="No deposits"
        emptyBody={adminEmpty(desk.status, query.trim() || status !== 'all' ? 'No simulated deposits match these filters.' : 'No simulated deposits have been submitted.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
      {deposit ? (
        <section className="rounded-lg border border-line bg-panel p-4 text-sm">
          <h2 className="font-medium">{person(desk.profiles, deposit.userId)} · {deposit.symbol}</h2>
          <p className="mt-2 text-muted">Amount {formatAmount(deposit.amount)}. Status {labelize(deposit.status)}. {when(deposit.createdAt)}</p>
          <p className="mt-1 text-muted">Note: {deposit.note || 'None'}</p>
          <DepositReview
            depositId={deposit.id}
            status={deposit.status}
            configured={configured && desk.status === 'ready'}
            onSaved={desk.reload}
          />
        </section>
      ) : null}
    </AppPage>
  )
}

export function AdminWithdrawalsPage() {
  const desk = useAdminDesk()
  const { configured } = useAuth()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('user') ?? '')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)
  const filtered = desk.withdrawals.filter((row) => (status === 'all' || row.status === status) && matches(query, [row.id, row.userId, person(desk.profiles, row.userId), row.symbol, row.status, row.destination]))
  const paging = usePage(filtered.length)
  const row = desk.withdrawals.find((item) => item.id === selected) ?? null

  return (
    <AppPage
      title="Withdrawals"
      description="Simulated withdrawal requests. Pending requests can be marked processing, completed, or rejected. Each review is audit logged. No blockchain transaction is created."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <TextField id="withdrawals-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
        <StatusFilter id="withdrawals-status" value={status} onChange={(value) => { setStatus(value); paging.setPage(1) }} />
      </div>
      <AdminTable
        caption="Withdrawals"
        columns={[
          { key: 'user', label: 'User' },
          { key: 'asset', label: 'Asset' },
          { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Date' },
          { key: 'view', label: 'Record' },
        ]}
        rows={filtered.slice(paging.start, paging.start + pageSize).map((item) => ({
          id: item.id,
          cells: {
            user: person(desk.profiles, item.userId),
            asset: assetMark(desk.assets, item.symbol),
            amount: formatAmount(item.amount),
            status: labelize(item.status),
            date: when(item.createdAt),
            view: <Button type="button" size="compact" variant="ghost" onClick={() => setSelected(item.id)}>View</Button>,
          },
        }))}
        loading={desk.status === 'loading'}
        emptyTitle="No withdrawals"
        emptyBody={adminEmpty(desk.status, query.trim() || status !== 'all' ? 'No simulated withdrawals match these filters.' : 'No simulated withdrawals have been submitted.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
      {row ? (
        <section className="rounded-lg border border-line bg-panel p-4 text-sm">
          <h2 className="font-medium">{person(desk.profiles, row.userId)} · {row.symbol}</h2>
          <p className="mt-2 text-muted">Amount {formatAmount(row.amount)}. Fee {formatAmount(row.fee)}. Status {labelize(row.status)}.</p>
          <p className="mt-1 break-all text-muted">Destination reference: {row.destination}</p>
          <p className="mt-1 text-muted">Note: {row.note || 'None'}</p>
          <WithdrawalReview
            withdrawalId={row.id}
            status={row.status}
            configured={configured && desk.status === 'ready'}
            onSaved={desk.reload}
          />
        </section>
      ) : null}
    </AppPage>
  )
}

export function AdminOrdersPage() {
  const desk = useAdminDesk()
  const { configured } = useAuth()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const filtered = desk.orders.filter((order) => matches(query, [order.id, person(desk.profiles, order.userId), order.pair, order.side, order.status]))
  const paging = usePage(filtered.length)
  const order = desk.orders.find((item) => item.id === selected) ?? null

  return (
    <AppPage
      title="Orders"
      description="Simulated orders across accounts. An open order can be cancelled. Completed orders stay as history."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          <TextField id="orders-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
        </div>
      </div>
      <AdminTable
        caption="Orders"
        columns={[
          { key: 'user', label: 'User' },
          { key: 'pair', label: 'Pair' },
          { key: 'side', label: 'Side' },
          { key: 'type', label: 'Type' },
          { key: 'price', label: 'Price', align: 'right' },
          { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'filled', label: 'Filled', align: 'right' },
          { key: 'remaining', label: 'Remaining', align: 'right' },
          { key: 'status', label: 'Status' },
          { key: 'created', label: 'Created' },
          { key: 'view', label: 'Record' },
        ]}
        rows={filtered.slice(paging.start, paging.start + pageSize).map((item) => ({
          id: item.id,
          cells: {
            user: person(desk.profiles, item.userId),
            pair: pairMark(desk.assets, desk.pairs, item.pair),
            side: labelize(item.side),
            type: labelize(item.type),
            price: item.price === null ? EMPTY_VALUE : formatAmount(item.price),
            amount: formatAmount(item.amount),
            filled: formatAmount(item.filled),
            remaining: formatAmount(item.remaining),
            status: labelize(item.status),
            created: when(item.createdAt),
            view: <Button type="button" size="compact" variant="ghost" onClick={() => setSelected(item.id)}>View</Button>,
          },
        }))}
        loading={desk.status === 'loading'}
        emptyTitle="No orders"
        emptyBody={adminEmpty(desk.status, 'Open orders can be cancelled from the record. Filled orders stay unchanged.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
      {order ? (
        <section className="rounded-lg border border-line bg-panel p-4 text-sm">
          <h2 className="font-medium">{order.pair} · {labelize(order.side)} · {labelize(order.status)}</h2>
          <p className="mt-2 text-muted">{person(desk.profiles, order.userId)} · {when(order.createdAt)}</p>
          <AdminOrderCancel
            orderId={order.id}
            status={order.status}
            configured={configured && desk.status === 'ready'}
            onSaved={desk.reload}
          />
        </section>
      ) : null}
    </AppPage>
  )
}

export function AdminTradesPage() {
  const desk = useAdminDesk()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('user') ?? '')
  const filtered = desk.trades.filter((trade) => matches(query, [trade.id, trade.userId, person(desk.profiles, trade.userId), trade.pair, trade.side]))
  const paging = usePage(filtered.length)

  return (
    <AppPage
      title="Trades"
      description="Completed simulated trades are immutable from this screen. They are platform fills, not market prints."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="w-full max-w-sm">
        <TextField id="trades-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
      </div>
      <AdminTable
        caption="Trades"
        columns={[
          { key: 'user', label: 'User' },
          { key: 'pair', label: 'Pair' },
          { key: 'side', label: 'Side' },
          { key: 'price', label: 'Price', align: 'right' },
          { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'fee', label: 'Fee', align: 'right' },
          { key: 'time', label: 'Timestamp' },
        ]}
        rows={filtered.slice(paging.start, paging.start + pageSize).map((trade) => ({
          id: trade.id,
          cells: {
            user: person(desk.profiles, trade.userId),
            pair: pairMark(desk.assets, desk.pairs, trade.pair),
            side: labelize(trade.side),
            price: formatAmount(trade.price),
            amount: formatAmount(trade.amount),
            fee: formatAmount(trade.fee),
            time: when(trade.createdAt),
          },
        }))}
        loading={desk.status === 'loading'}
        emptyTitle="No trades"
        emptyBody={adminEmpty(desk.status, 'Platform trades are separate from real market prints.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
    </AppPage>
  )
}

export function AdminTransactionsPage() {
  const desk = useAdminDesk()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('user') ?? '')
  const [type, setType] = useState('all')
  const filtered = desk.ledger.filter((row) => (type === 'all' || row.type === type) && matches(query, [row.id, row.userId, person(desk.profiles, row.userId), row.type, row.symbol, row.status]))
  const paging = usePage(filtered.length)

  return (
    <AppPage
      title="Ledger"
      description="Deposits, withdrawals, trades, fees, and administrator adjustments. Adjustments are identified by type and cannot be edited here."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <TextField id="ledger-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
        <SelectField id="ledger-type" label="Type" value={type} onChange={(event) => { setType(event.target.value); paging.setPage(1) }}>
          <option value="all">All types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="trade">Trade</option>
          <option value="fee">Fee</option>
          <option value="admin_adjustment">Admin adjustment</option>
        </SelectField>
      </div>
      <AdminTable
        caption="Ledger"
        columns={[
          { key: 'id', label: 'Transaction ID' },
          { key: 'user', label: 'User' },
          { key: 'type', label: 'Type' },
          { key: 'asset', label: 'Asset' },
          { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Date' },
        ]}
        rows={filtered.slice(paging.start, paging.start + pageSize).map((row) => ({
          id: row.id,
          cells: {
            id: <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
            user: person(desk.profiles, row.userId),
            type: row.type === 'admin_adjustment' ? <span className="text-warn">Admin adjustment</span> : labelize(row.type),
            asset: assetMark(desk.assets, row.symbol),
            amount: formatAmount(row.amount),
            status: labelize(row.status),
            date: when(row.createdAt),
          },
        }))}
        loading={desk.status === 'loading'}
        emptyTitle="No ledger entries"
        emptyBody={adminEmpty(desk.status, 'Balance changes will be written here and cannot be edited from this screen.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
    </AppPage>
  )
}

export function AdminAuditPage() {
  const desk = useAdminDesk()
  const [query, setQuery] = useState('')
  const assets = new Map(desk.assets.map((asset) => [asset.id, asset.listed ? asset.symbol : `${asset.symbol} · delisted`]))
  const filtered = desk.audit.filter((row) => matches(query, [row.action, row.note, person(desk.profiles, row.adminId), person(desk.profiles, row.targetUserId), assets.get(row.assetId) ?? '']))
  const paging = usePage(filtered.length)

  return (
    <AppPage
      title="Audit log"
      description="Administrator actions with the previous value, new value, and note. This screen has no edit or delete control."
      notice={desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : undefined}
    >
      <div className="w-full max-w-sm">
        <TextField id="audit-search" label="Search" value={query} onChange={(event) => { setQuery(event.target.value); paging.setPage(1) }} />
      </div>
      <AdminTable
        caption="Audit log"
        columns={[
          { key: 'admin', label: 'Admin' },
          { key: 'action', label: 'Action' },
          { key: 'target', label: 'Target user' },
          { key: 'asset', label: 'Asset' },
          { key: 'previous', label: 'Previous' },
          { key: 'next', label: 'New value' },
          { key: 'note', label: 'Note' },
          { key: 'time', label: 'Timestamp' },
        ]}
        rows={filtered.slice(paging.start, paging.start + pageSize).map((row) => ({
          id: row.id,
          cells: {
            admin: person(desk.profiles, row.adminId),
            action: row.action,
            target: row.targetUserId ? person(desk.profiles, row.targetUserId) : EMPTY_VALUE,
            asset: assets.get(row.assetId) ?? EMPTY_VALUE,
            previous: row.previous || EMPTY_VALUE,
            next: row.next || EMPTY_VALUE,
            note: row.note || EMPTY_VALUE,
            time: when(row.createdAt),
          },
        }))}
        loading={desk.status === 'loading'}
        emptyTitle="No audit records"
        emptyBody={adminEmpty(desk.status, 'Sensitive actions will append a record. Nothing here can be rewritten.')}
      />
      <Pager page={paging.page} pageCount={paging.pageCount} onPage={paging.setPage} />
    </AppPage>
  )
}

export function AdminSettingsPage() {
  const { configured, profile } = useAuth()
  const superAdmin = profile?.role === 'super_admin'
  const closed = configured && profile && !superAdmin

  return (
    <AppPage
      title="Platform settings"
      description="Simulated trading fees. Role changes are on the user record, and only a super administrator can make them."
      notice={
        <Notice title={closed ? 'ADMINISTRATOR ACCESS ONLY' : superAdmin ? 'SUPER ADMIN' : 'SUPER ADMIN CONTROLS'}>
          {closed
            ? 'This account is an administrator, not a super administrator. It cannot promote anyone or save platform settings.'
            : superAdmin
              ? 'Fee changes are audited. This form cannot grant the super administrator role.'
              : 'A normal administrator cannot promote anyone, including themselves. Fees are not saved until a super administrator is signed in.'}
        </Notice>
      }
    >
      <FeeSettings configured={configured} superAdmin={superAdmin} />
    </AppPage>
  )
}
