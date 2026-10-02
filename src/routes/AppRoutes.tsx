import { Route, Routes } from 'react-router-dom'
import { AdminLayout, UserLayout } from '@/layouts/AppShell'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import {
  AdminAssetsPage,
  AdminAuditPage,
  AdminDashboardPage,
  AdminDepositsPage,
  AdminOrdersPage,
  AdminSettingsPage,
  AdminTradesPage,
  AdminTransactionsPage,
  AdminUsersPage,
  AdminWithdrawalsPage,
} from '@/pages/admin/screens'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { DashboardPage } from '@/pages/user/DashboardPage'
import { DepositPage } from '@/pages/user/DepositPage'
import { MarketsPage } from '@/pages/user/MarketsPage'
import { NotificationsPage } from '@/pages/user/NotificationsPage'
import { OrdersPage } from '@/pages/user/OrdersPage'
import { PortfolioPage } from '@/pages/user/PortfolioPage'
import { SettingsPage } from '@/pages/user/SettingsPage'
import { TradePage } from '@/pages/user/TradePage'
import { TransactionsPage } from '@/pages/user/TransactionsPage'
import { WalletPage } from '@/pages/user/WalletPage'
import { WatchlistPage } from '@/pages/user/WatchlistPage'
import { WithdrawPage } from '@/pages/user/WithdrawPage'
import { AdminRoute } from '@/routes/AdminRoute'
import { paths } from '@/routes/paths'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.home} element={<LandingPage />} />
      <Route element={<AuthLayout />}>
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.register} element={<RegisterPage />} />
        <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<UserLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
          <Route path={paths.markets} element={<MarketsPage />} />
          <Route path={paths.trade} element={<TradePage />} />
          <Route path={paths.portfolio} element={<PortfolioPage />} />
          <Route path={paths.orders} element={<OrdersPage />} />
          <Route path={paths.transactions} element={<TransactionsPage />} />
          <Route path={paths.wallet} element={<WalletPage />} />
          <Route path={paths.deposit} element={<DepositPage />} />
          <Route path={paths.withdraw} element={<WithdrawPage />} />
          <Route path={paths.watchlist} element={<WatchlistPage />} />
          <Route path={paths.notifications} element={<NotificationsPage />} />
          <Route path={paths.settings} element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path={paths.adminLogin} element={<AdminLoginPage />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path={paths.adminDashboard} element={<AdminDashboardPage />} />
          <Route path={paths.adminUsers} element={<AdminUsersPage />} />
          <Route path={paths.adminAssets} element={<AdminAssetsPage />} />
          <Route path={paths.adminDeposits} element={<AdminDepositsPage />} />
          <Route path={paths.adminWithdrawals} element={<AdminWithdrawalsPage />} />
          <Route path={paths.adminOrders} element={<AdminOrdersPage />} />
          <Route path={paths.adminTrades} element={<AdminTradesPage />} />
          <Route path={paths.adminTransactions} element={<AdminTransactionsPage />} />
          <Route path={paths.adminAuditLog} element={<AdminAuditPage />} />
          <Route path={paths.adminSettings} element={<AdminSettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
