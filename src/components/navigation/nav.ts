import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  CandlestickChart,
  Coins,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  PieChart,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Star,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { paths } from '@/routes/paths'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const userNav: NavItem[] = [
  { to: paths.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: paths.markets, label: 'Markets', icon: LineChart },
  { to: paths.trade, label: 'Trade', icon: CandlestickChart },
  { to: paths.portfolio, label: 'Portfolio', icon: PieChart },
  { to: paths.orders, label: 'Orders', icon: ListOrdered },
  { to: paths.wallet, label: 'Wallet', icon: Wallet },
  { to: paths.deposit, label: 'Deposit', icon: ArrowDownToLine },
  { to: paths.withdraw, label: 'Withdraw', icon: ArrowUpFromLine },
  { to: paths.transactions, label: 'Transactions', icon: Receipt },
  { to: paths.watchlist, label: 'Watchlist', icon: Star },
  { to: paths.notifications, label: 'Notifications', icon: Bell },
  { to: paths.settings, label: 'Settings', icon: Settings },
]

export const mobileNav: NavItem[] = [
  { to: paths.dashboard, label: 'Home', icon: LayoutDashboard },
  { to: paths.markets, label: 'Markets', icon: LineChart },
  { to: paths.trade, label: 'Trade', icon: CandlestickChart },
  { to: paths.wallet, label: 'Wallet', icon: Wallet },
  { to: paths.orders, label: 'Orders', icon: ListOrdered },
]

export const adminNav: NavItem[] = [
  { to: paths.adminDashboard, label: 'Overview', icon: LayoutDashboard },
  { to: paths.adminUsers, label: 'Users', icon: Users },
  { to: paths.adminAssets, label: 'Assets', icon: Coins },
  { to: paths.adminDeposits, label: 'Deposits', icon: ArrowDownToLine },
  { to: paths.adminWithdrawals, label: 'Withdrawals', icon: ArrowUpFromLine },
  { to: paths.adminOrders, label: 'Orders', icon: ListOrdered },
  { to: paths.adminTrades, label: 'Trades', icon: CandlestickChart },
  { to: paths.adminTransactions, label: 'Ledger', icon: ScrollText },
  { to: paths.adminAuditLog, label: 'Audit log', icon: Shield },
  { to: paths.adminSettings, label: 'Settings', icon: SlidersHorizontal },
]
