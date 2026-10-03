import { Link } from 'react-router-dom'
import { balanceRows } from '@/components/desk/rows'
import { AppPage } from '@/components/ui/AppPage'
import { buttonClass } from '@/components/ui/Button'
import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { Notice } from '@/components/ui/Notice'
import { deskEmpty, useDesk } from '@/hooks/useDesk'
import { pricesBySymbol, useMarketPrices } from '@/hooks/useMarketPrices'
import { paths } from '@/routes/paths'

const columns: TableColumn[] = [
  { key: 'asset', label: 'Asset' },
  { key: 'available', label: 'Available', align: 'right' },
  { key: 'locked', label: 'Locked', align: 'right' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'value', label: 'Value', align: 'right' },
  { key: 'change', label: '24h change', align: 'right' },
]

const links = [
  [paths.deposit, 'Deposit'],
  [paths.withdraw, 'Withdraw'],
  [paths.trade, 'Trade'],
  [paths.transactions, 'Transactions'],
] as const

export function WalletPage() {
  const desk = useDesk()
  const market = useMarketPrices(desk.assets.map((asset) => asset.providerAssetId))
  const priced = pricesBySymbol(desk.assets, market.byId)

  return (
    <AppPage
      title="Wallet"
      description="Simulated balances for this account. Available, locked, and total amounts come from the wallet record."
      notice={
        <>
          <Notice title="SIMULATED WALLET">
            Balances have no monetary value. Prices, when connected, are reference figures and do not mean the asset is held in custody.
          </Notice>
          {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {links.map(([to, label]) => (
          <Link key={to} to={to} className={buttonClass({ variant: 'secondary' })}>
            {label}
          </Link>
        ))}
      </div>
      <DataTable
        caption="Wallet balances"
        columns={columns}
        rows={balanceRows(desk.balances, priced)}
        loading={desk.status === 'loading'}
        emptyTitle="No wallet balances"
        emptyBody={deskEmpty(desk.status, 'A wallet is created with the account. Balance rows appear after a simulated deposit. Nothing is hardcoded here.')}
      />
    </AppPage>
  )
}
