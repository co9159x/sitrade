export type UserRole = 'user' | 'admin' | 'super_admin'

export type AccountStatus = 'active' | 'suspended'

export type OrderSide = 'buy' | 'sell'

export type OrderType = 'market' | 'limit' | 'stop'

export type OrderStatus =
  | 'open'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'inactive'

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'trade'
  | 'fee'
  | 'admin_adjustment'

export type LedgerStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export type Profile = {
  id: string
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export type Asset = {
  id: string
  symbol: string
  name: string
  providerAssetId: string
  quoteCurrency: string
  listed: boolean
  tradingEnabled: boolean
  depositsEnabled: boolean
  withdrawalsEnabled: boolean
  minOrder: number
  withdrawalFee: number
}

export type TradingPair = {
  id: string
  baseAssetId: string
  quoteAssetId: string
  symbol: string
  tradingEnabled: boolean
}

export type WalletBalance = {
  assetId: string
  available: number
  locked: number
}

export type Order = {
  id: string
  userId: string
  pairId: string
  side: OrderSide
  type: OrderType
  price: number | null
  stopPrice: number | null
  amount: number
  filled: number
  remaining: number
  status: OrderStatus
  fee: number
  createdAt: string
}

export type Trade = {
  id: string
  orderId: string
  userId: string
  pairId: string
  side: OrderSide
  price: number
  amount: number
  fee: number
  createdAt: string
}

export type LedgerEntry = {
  id: string
  userId: string
  type: TransactionType
  assetId: string
  amount: number
  status: LedgerStatus
  createdAt: string
}

export type AppNotification = {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
}
