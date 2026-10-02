# CRYPTO TRADING PLATFORM TRAINING PROJECT

## FULL CURSOR BUILD PROMPT

IMPORTANT:

You are building a professional cryptocurrency trading platform as a **DEMO / TRAINING ENVIRONMENT only**.

This is NOT a real cryptocurrency exchange and must never process real money, real cryptocurrency, real blockchain transactions, real bank payments, or real withdrawals.

All deposits, withdrawals, balances, trades, orders, fees, portfolio values and transactions created by users are simulated application data stored in the database.

However, **market prices and market information should use real cryptocurrency market data from an external market data provider**.

The market itself is real.

The user's money and trading activity are simulated.

The platform must clearly display:

**DEMO / TRAINING ENVIRONMENT**

and a clear notice explaining that all balances, trades, deposits and withdrawals have no real monetary value.

Do not connect any real payment processor, bank account, blockchain wallet, cryptocurrency custody service, or real exchange trading execution.

Do not implement KYC at this stage. KYC may be added as a separate future stage.

---

# 1. CORE OBJECTIVE

Build a full stack crypto trading platform suitable for:

• Training
• Learning
• Portfolio demonstration
• Testing trading interfaces
• Understanding exchange architecture
• Practising simulated trading

The platform should contain two completely separate experiences:

### USER / TRADER APPLICATION

This is where normal users can:

• Register
• Log in
• View markets
• View real market prices
• View charts
• Place simulated trades
• Manage simulated balances
• View simulated portfolio
• View simulated orders
• View simulated transactions
• Manage their watchlist
• Manage account settings

### ADMIN MANAGEMENT PANEL

This is where authorised administrators can:

• Manage users
• Manage assets
• List and delist cryptocurrencies
• Manage simulated balances
• Manage simulated deposits
• Manage simulated withdrawals
• View orders
• View trades
• View transactions
• Review audit logs
• Manage platform settings

The admin panel must be completely separate from the normal user application.

The admin panel must have:

• Separate routes
• Separate authentication screen
• Separate layout
• Separate navigation
• Separate dashboard
• Role based access control
• Backend/database authorization

A normal user must never be able to access admin functionality simply by changing a URL.

Do not rely only on frontend route protection.

Supabase Row Level Security and proper backend/database authorization must also prevent unauthorized access.

---

# 2. IMPORTANT REAL MARKET DATA RULE

The platform must use **real cryptocurrency market data**.

Examples include:

• Bitcoin current price
• Ethereum current price
• Solana current price
• XRP current price
• Cardano current price
• Dogecoin current price

The application should obtain real market data from a suitable cryptocurrency market data provider such as CoinGecko or another appropriate provider.

Use the provider's API according to its current terms, rate limits and capabilities.

The exact provider should be implemented behind a market data service abstraction so that it can be replaced later.

The application should use real data for:

• Current prices
• 24 hour percentage changes
• 24 hour highs
• 24 hour lows
• Trading volume
• Market capitalisation
• Historical prices
• OHLC/candlestick data
• Trading charts
• Reference prices for simulated trades

However:

**REAL MARKET DATA DOES NOT MEAN REAL TRADING.**

Never send the user's simulated order to a real cryptocurrency exchange.

For example:

If Bitcoin's real market price is £85,000:

The platform can display:

BTC/GBP
£85,000

A user can then place a simulated buy order.

The platform may execute the simulated order at the real market reference price.

The user's simulated wallet is updated.

No Bitcoin is purchased.

No real money moves.

No blockchain transaction occurs.

No real exchange order is created.

---

# 3. REAL VS SIMULATED DATA

## REAL

The following should come from real market data:

• Cryptocurrency prices
• 24 hour price changes
• Market statistics
• Market capitalisation
• Trading volume
• Historical prices
• OHLC data
• Candlestick charts
• Market reference prices

## SIMULATED

The following are entirely simulated:

• User balances
• Demo wallets
• Deposits
• Withdrawals
• Orders
• Trades
• Trading fees
• Portfolio ownership
• Profit and loss
• Transactions
• Admin balance adjustments

## NEVER REAL

Never implement:

• Real money deposits
• Real money withdrawals
• Real cryptocurrency transfers
• Real blockchain transactions
• Real exchange orders
• Real crypto custody
• Real payment processing

---

# 4. TECH STACK

Use:

• React
• TypeScript
• Vite
• Tailwind CSS
• Supabase Auth
• Supabase PostgreSQL
• Supabase Row Level Security
• Recharts or another suitable charting library
• Lucide React icons

Use a clean modular architecture.

Do not introduce unnecessary dependencies.

Use environment variables for configuration.

Never expose Supabase service role keys or other secret credentials in frontend code.

---

# 5. DESIGN DIRECTION

Create a professional modern cryptocurrency exchange interface.

Take inspiration from the usability, information density and interaction patterns of professional platforms such as Binance, Coinbase Advanced, Kraken and Bybit.

However, do not copy:

• Branding
• Logos
• Exact layouts
• Proprietary graphics
• Proprietary UI designs

Create original branding and UI.

The platform should feel like a serious professional trading application rather than a generic SaaS dashboard.

Preferred visual direction:

• Dark charcoal / near black background
• Slightly lighter solid panels
• Subtle borders
• Minimal shadows
• Green positive price movement
• Red negative price movement
• One restrained blue or purple accent
• Moderate border radius
• Clean typography
• High information density
• Excellent spacing
• Professional icons
• Clear hover states
• Clear active states
• Subtle animations
• Minimal gradients
• Minimal glassmorphism

Do NOT create:

• Excessive glassmorphism
• Excessive gradients
• Huge empty spaces
• Oversized buttons
• Cartoon-like cryptocurrency graphics
• Generic SaaS dashboard styling
• Excessive animations

---

# 6. RESPONSIVE DESIGN

The application must be fully responsive.

Support:

• Desktop
• Laptop
• Tablet
• Mobile

Desktop should be the primary trading experience.

Do not simply shrink the desktop interface on mobile.

On mobile:

• Collapse the sidebar
• Use mobile navigation where appropriate
• Stack trading sections
• Make charts usable
• Make order entry usable
• Make tables responsive
• Convert dense tables to cards where appropriate
• Maintain accessible controls

---

# 7. DEMO LABELING

The demo status must be obvious throughout the application.

Display a persistent:

**DEMO / TRAINING ENVIRONMENT**

label in the main application UI.

Use appropriate notices on:

• Deposit
• Withdrawal
• Trading
• Wallet
• Portfolio
• Transaction history

Make it impossible for users to reasonably mistake the platform for a live financial service.

---

# 8. USER ROUTES

Create the following user routes:

/

/login

/register

/dashboard

/markets

/trade

/portfolio

/orders

/transactions

/wallet

/deposit

/withdraw

/watchlist

/notifications

/settings

Protected routes must require authentication where appropriate.

Unauthenticated users attempting to access protected user pages should be redirected to login.

---

# 9. LANDING PAGE

Create a professional landing page.

Include:

• Hero section
• Platform overview
• Supported cryptocurrencies
• Trading features
• Security/features section
• How it works
• Demo environment explanation
• CTA
• Footer
• Login link
• Register link

The landing page must clearly state that this is a simulated training platform.

---

# 10. AUTHENTICATION

Use Supabase Authentication.

Registration should include:

• Full name
• Email
• Password
• Confirm password
• Terms acceptance

Password validation should include sensible requirements.

Handle:

• Loading states
• Validation errors
• Authentication errors
• Successful registration
• Successful login
• Logout
• Password reset

After registration:

• Create the user's profile
• Create their initial demo wallet/balance structure
• Do not hardcode balances inside the UI
• Store account information in Supabase

Login should support:

• Email
• Password
• Remember me
• Forgot password
• Registration link

---

# 11. USER DASHBOARD

Create a professional trading dashboard.

Include:

• Total portfolio value
• Available balance
• Today's P/L
• Total P/L
• Percentage change
• Invested value
• Market overview
• Watchlist
• Portfolio allocation chart
• Recent transactions
• Open orders
• Recent trades
• Quick Buy/Sell

Initial market examples can include:

BTC
ETH
SOL
XRP
ADA
DOGE

However, assets should ultimately be database driven.

Do not hardcode user specific balances.

Portfolio values must be calculated from the underlying wallet, asset, trade and market data.

---

# 12. MARKETS PAGE

Create a market discovery page.

Include:

• Search
• Categories
• Watchlist
• Top gainers
• Top losers
• Trading volume
• Market cap
• Current price
• 24 hour change
• 24 hour high
• 24 hour low

Each asset should be clickable and open the relevant trading page.

Assets should be database driven.

Do not hardcode market records inside React components.

Market prices must come from the real market data service.

---

# 13. TRADING TERMINAL

Create a professional trading terminal.

Desktop layout:

### LEFT

• Market selector
• Watchlist
• Trading pairs

### CENTER

• Large candlestick chart
• Volume chart
• Timeframe controls

### RIGHT

• Order book
• Order entry

### BOTTOM

• Open orders
• Order history
• Trade history
• Recent trades

Trading header should show:

• Trading pair
• Current real market price
• 24 hour percentage
• 24 hour high
• 24 hour low
• Volume
• Market status
• Market data status

Chart controls:

• 1m
• 5m
• 15m
• 1H
• 4H
• 1D
• Chart type
• Zoom
• Fullscreen

The chart should use real historical market data when the market data stage is implemented.

Do not generate random candles on every React render.

---

# 14. ORDER BOOK

Display:

• Sell orders
• Buy orders
• Price
• Amount
• Total
• Spread

The order book should be clearly identified as either:

• Simulated order book data

or, if a suitable real market data provider supports it:

• Real market reference order book data

Do not confuse real market data with the platform's simulated user orders.

The user's own orders should remain simulated.

---

# 15. RECENT TRADES

Display:

• Price
• Amount
• Time
• Buy/Sell indicator

If sourced from real market data, clearly distinguish real market trades from simulated platform trades.

The platform's own trade history remains simulated.

---

# 16. ORDER ENTRY

Create Buy and Sell tabs.

Support:

• Market
• Limit
• Stop

Fields:

• Price
• Amount
• Total
• Available balance
• Estimated fee
• Estimated total

Buttons:

• Buy [Asset]
• Sell [Asset]

Validate:

• Insufficient balance
• Invalid quantity
• Invalid price
• Invalid order type
• Invalid values

Do not make buttons appear to execute trades if the backend functionality has not been implemented yet.

---

# 17. SIMULATED TRADING ENGINE

Implement this only in the designated trading stage.

Market orders:

• Execute immediately using the latest available real market price as the simulated reference price.

Limit orders:

• Remain open until the real market price reaches the user's simulated limit condition.
• Users can cancel them.

Stop orders:

• Remain inactive until the real market price reaches the trigger condition.
• Then process through the simulated trading engine.

When an order is submitted:

1. Validate the order
2. Validate the user's simulated balance
3. Calculate simulated fee
4. Create the order
5. Reserve/lock required simulated balance where appropriate
6. Execute immediately or leave open depending on order type
7. Update order status
8. Create a simulated trade if executed
9. Update simulated wallet balances
10. Update portfolio calculations
11. Create transaction record
12. Create notification

Balance updates must be atomic.

Avoid duplicate balance changes.

Use database transactions or safe atomic database functions where appropriate.

---

# 18. SIMULATED TRADING FEES

Create configurable simulated trading fees.

Fees should be:

• Visible before order confirmation
• Stored with executed trades
• Included in transaction history
• Included in portfolio calculations

These fees have no real monetary value.

---

# 19. PORTFOLIO PAGE

Display:

• Total value
• Available cash
• Invested value
• Unrealised P/L
• Realised P/L
• Portfolio allocation

Asset table:

• Asset
• Amount
• Average price
• Current price
• Value
• P/L
• 24 hour change

Charts:

• Allocation chart
• Performance chart
• Individual asset performance

Current asset values must use real current market prices.

Portfolio ownership and balances remain simulated.

All values must be derived from database data and current market data.

---

# 20. ORDERS PAGE

Tabs:

• Open
• Completed
• Cancelled

Columns:

• Trading pair
• Type
• Side
• Price
• Amount
• Filled
• Remaining
• Status
• Fee
• Date

Users can cancel their own open simulated orders.

When cancelled:

• Release locked simulated balance
• Update order status
• Create relevant transaction data where appropriate
• Do not modify completed historical orders

---

# 21. DEPOSIT PAGE

This is a simulated deposit system.

Display:

• Currency
• Amount
• Current simulated balance
• Deposit amount
• New simulated balance

Clearly display:

**SIMULATED DEPOSIT**

When submitted:

• Validate amount
• Create deposit record
• Create transaction
• Update simulated balance
• Update history
• Create notification

No real money is accepted.

---

# 22. WITHDRAWAL PAGE

This is a simulated withdrawal system.

Fields:

• Asset/currency
• Amount
• Destination address/reference
• Available balance
• Withdrawal amount
• Network fee
• Remaining balance

Validate:

• Balance
• Amount
• Destination/reference
• Asset status

Clearly display:

**SIMULATED WITHDRAWAL**

When submitted:

• Validate
• Reserve/deduct simulated amount appropriately
• Create withdrawal record
• Create transaction
• Create notification

No blockchain transaction should ever occur.

---

# 23. TRANSACTION HISTORY

Include:

• Deposit
• Withdrawal
• Trade
• Fee
• Admin adjustment

Columns:

• Transaction ID
• Type
• Asset
• Amount
• Status
• Date

Include:

• Search
• Filters
• Date range
• Pagination

---

# 24. WALLET

Create a wallet page showing the user's simulated assets.

Display:

• Asset
• Available balance
• Locked balance
• Total balance
• Current real market price
• Value
• 24 hour change

Provide navigation to:

• Deposit
• Withdraw
• Trade
• Transactions

---

# 25. WATCHLIST

Create user specific watchlists.

Display:

• Asset
• Current real market price
• 24 hour change
• Volume
• Market cap
• Mini chart

Users can add and remove assets.

Watchlists must belong to the authenticated user.

---

# 26. NOTIFICATIONS

Include:

• Trade completed
• Order filled
• Deposit completed
• Withdrawal processed
• Account alerts
• System announcements

Support:

• Read/unread
• Mark all as read
• Notification timestamps

---

# 27. SETTINGS

Profile:

• Name
• Email
• Phone
• Profile image

Security:

• Change password
• 2FA UI
• Login history
• Active sessions
• Security notifications

Preferences:

• Display currency
• Language
• Theme
• Notification preferences

Include simulated API key management UI.

Do not create real exchange API keys.

---

# 28. ADMIN APPLICATION

Admin routes:

/admin/login

/admin/dashboard

/admin/users

/admin/assets

/admin/deposits

/admin/withdrawals

/admin/orders

/admin/trades

/admin/transactions

/admin/audit-log

/admin/settings

The admin application must have a completely different layout from the user application.

It should feel like an internal operations system.

Use:

• Separate sidebar
• Separate header
• Admin focused tables
• Filters
• Search
• Modals
• Stats
• Charts
• Audit information

The admin interface must not appear in normal user navigation.

---

# 29. ADMIN AUTHENTICATION

Create a separate admin login page.

Roles:

• User
• Admin
• Super Admin

Use Supabase Auth plus database role checks.

Normal users attempting to access:

/admin/*

must be denied.

Do not rely only on frontend checks.

Never expose passwords.

Never allow a client to simply submit a role and become an admin.

---

# 30. ADMIN DASHBOARD

Display:

• Total registered users
• Active users
• Total simulated deposits
• Total simulated withdrawals
• Simulated trading volume
• Total platform demo balance
• Listed cryptocurrencies
• Open orders
• Recent activity

Charts:

• User growth
• Trading volume
• Deposits
• Withdrawals

Where appropriate, distinguish between:

• Real market volume

and:

• Simulated platform trading volume

Do not represent simulated platform statistics as real-world exchange statistics.

---

# 31. ADMIN USER MANAGEMENT

Table:

• User ID
• Name
• Email
• Status
• Account balance
• Registration date
• Last activity

Actions:

• View user
• Suspend
• Reactivate
• Reset demo balance
• View transactions
• View trades
• View deposits
• View withdrawals

Never retrieve or display user passwords.

---

# 32. ADMIN CRYPTOCURRENCY MANAGEMENT

Admins can:

• Add asset
• Edit asset
• List asset
• Delist asset
• Enable trading
• Disable trading
• Enable deposits
• Disable deposits
• Enable withdrawals
• Disable withdrawals
• Create trading pairs
• Edit trading pairs
• Configure minimum order
• Configure simulated withdrawal fee
• Configure external market-data provider ID

The admin should not normally manually override real market prices.

Real market prices should come from the configured market-data provider.

Example assets:

BTC
ETH
SOL
XRP
ADA
DOGE
USDT
BNB
AVAX
DOT
LINK

These are examples only.

Assets must ultimately come from the database.

When an asset is delisted:

• Remove it from public market discovery
• Prevent new simulated trades
• Prevent new simulated deposits
• Prevent new simulated withdrawals
• Preserve historical transactions
• Preserve historical trades
• Mark historical records appropriately as related to a delisted asset

Require confirmation before destructive state changes.

---

# 33. ADMIN USER BALANCE MANAGEMENT

Admins can search for a user and view:

• Balances
• Deposit history
• Withdrawal history
• Trading history
• Transaction history

Add simulated balance fields:

• User
• Currency
• Amount
• Reference
• Note

When balance is increased:

• Update database balance
• Create transaction
• Identify it as an admin adjustment
• Record admin user
• Record timestamp
• Create audit log

Remove simulated balance using equivalent controls.

Never silently change balances.

---

# 34. ADMIN DEPOSITS

List and filter:

• User
• Currency
• Status
• Date

Actions:

• View
• Approve
• Reject
• Add note

All actions must be audit logged.

---

# 35. ADMIN WITHDRAWALS

List and filter:

• User
• Asset
• Status
• Date

Actions:

• View
• Approve
• Reject
• Processing
• Completed
• Add note

Every status change must be audit logged.

These are simulated withdrawals only.

---

# 36. ADMIN ORDERS

Display:

• User
• Trading pair
• Side
• Type
• Price
• Amount
• Filled
• Remaining
• Status
• Created date

Admins can:

• View details
• Cancel appropriate open simulated orders

Do not silently alter completed historical orders.

---

# 37. ADMIN TRADES

Display:

• User
• Trading pair
• Side
• Price
• Amount
• Fee
• Timestamp

Completed historical trades should be treated as immutable from the normal admin UI.

---

# 38. ADMIN TRANSACTIONS

Create a complete ledger containing:

• Deposit
• Withdrawal
• Trade
• Fee
• Admin adjustment

Admin adjustments must be clearly identified.

---

# 39. ADMIN AUDIT LOG

Audit records should contain:

• Admin user
• Action
• Target user
• Asset
• Previous value
• New value
• Reason/note
• Timestamp

Examples:

• Balance added
• Balance removed
• Asset delisted
• User suspended
• Withdrawal approved
• Order cancelled

Audit records should not be editable through the normal UI.

---

# 40. SUPER ADMIN

Super Admin can:

• Manage admins
• Change admin roles
• Manage platform settings
• Configure simulated fees
• Configure system settings

Normal Admin users must not be able to promote themselves or another user to Super Admin.

---

# 41. DATABASE ARCHITECTURE

Create a properly structured Supabase PostgreSQL database.

Tables should include:

• profiles
• roles
• assets
• trading_pairs
• wallets
• wallet_balances
• orders
• trades
• transactions
• deposits
• withdrawals
• notifications
• watchlists
• admin_actions
• audit_logs

Use:

• Primary keys
• Foreign keys
• Appropriate constraints
• Created timestamps
• Updated timestamps
• Useful indexes

Do not duplicate data unnecessarily.

Avoid storing derived values when they can safely be calculated from source data.

---

# 42. ROW LEVEL SECURITY

Implement proper Supabase RLS.

Normal users can only access their own:

• Profile
• Wallets
• Wallet balances
• Orders
• Trades
• Transactions
• Deposits
• Withdrawals
• Notifications
• Watchlists

Admins should have appropriate access based on their role.

Users must not be able to:

• Modify their own role
• Modify another user's balance
• Modify another user's transactions
• Access another user's private information
• Create themselves as admin
• Access admin only functionality

Do not trust client supplied roles.

---

# 43. DATA INTEGRITY

Balance updates are critical.

Maintain consistency between:

• Wallet balances
• Orders
• Trades
• Transactions
• Portfolio calculations

Avoid:

• Duplicate balance updates
• Negative balances where prohibited
• Double execution
• Double withdrawals
• Double deposits
• Inconsistent order status

Use atomic database functions or transactions where appropriate.

---

# 44. REAL TIME MARKET DATA ARCHITECTURE

Create a dedicated market data service.

For example:

src/services/marketData/

or another equivalent clean architecture.

Create a market data provider abstraction.

Conceptually:

MarketDataProvider

with methods such as:

• getMarketPrices()
• getAssetPrice()
• getMarketOverview()
• getHistoricalPrices()
• getOHLCData()
• getAssetMetadata()

Do not put market data API calls directly inside individual React components.

The application should communicate with the market data service.

The market data provider should be replaceable.

---

# 45. LIVE PRICE UPDATES

Prices should update automatically without requiring the user to refresh the page.

Prefer WebSocket streaming when the selected market data provider supports it and when appropriate for the project's API plan.

If WebSocket access is not available or appropriate:

Use controlled REST polling.

Do not:

• Request prices on every React render
• Make separate unnecessary requests for every component
• Exceed provider rate limits
• Create dozens of duplicate polling loops

Centralise market data fetching.

Use caching.

Use batching where possible.

---

# 46. MARKET DATA FAILURE HANDLING

If the external market data provider becomes unavailable:

• Show the last known price where appropriate
• Display a clear "Market data delayed" state
• Show the last update time
• Do not silently display fabricated prices
• Do not generate random replacement prices
• Do not execute simulated market orders against unknown prices without appropriate handling
• Show clear loading/error states

Never pretend stale data is live.

---

# 47. MARKET DATA STATUS

Where appropriate display:

BTC/GBP
£XX,XXX.XX
+X.XX%
Live market data
Updated X seconds ago

If the data becomes stale:

BTC/GBP
£XX,XXX.XX
Market data delayed
Updated X minutes ago

The exact wording can be improved by the UI implementation.

---

# 48. SUPPORTED ASSETS AND PROVIDER IDS

The asset database should contain the external market data provider identifier.

For example, conceptually:

BTC → provider asset ID
ETH → provider asset ID
SOL → provider asset ID

Do not rely only on ticker symbols.

The external provider identifier must be stored in the database or appropriate configuration layer.

This allows the platform to correctly map platform assets to external market data.

---

# 49. HISTORICAL MARKET DATA

Trading charts should use real historical cryptocurrency market data.

Support:

• 1m
• 5m
• 15m
• 1H
• 4H
• 1D

However, respect the actual granularity available from the selected provider and API plan.

If a requested timeframe is unavailable:

• Use the closest suitable supported timeframe

or:

• Clearly show that the timeframe is unavailable.

Do not fabricate historical candles.

---

# 50. SIMULATED ORDER EXECUTION USING REAL PRICES

The simulated trading engine should use real market prices as its reference.

Example:

Real BTC price:

£85,000

User places:

BUY
BTC
0.01 BTC

The application calculates the simulated order using the real reference price.

The system then:

• Creates a simulated order
• Calculates simulated fees
• Updates the user's simulated wallet
• Creates a simulated trade
• Creates a transaction

No real exchange interaction occurs.

---

# 51. LIMIT ORDERS USING REAL MARKET DATA

For simulated limit orders:

Compare the user's limit price against the latest real market price.

When the real market reaches the relevant simulated execution condition:

• Execute the simulated order
• Update simulated balance
• Create simulated trade
• Create transaction
• Create notification

The real market data determines when the simulated order condition is reached.

No real order is sent anywhere.

---

# 52. STOP ORDERS USING REAL MARKET DATA

For simulated stop orders:

Monitor the relevant real market price.

When the trigger condition is reached:

• Activate the simulated order
• Process it through the simulated trading engine
• Apply simulated fees
• Update simulated balances
• Create trade
• Create transaction
• Create notification

---

# 53. MARKET DATA CACHING

Use an appropriate caching strategy.

Do not make separate requests for every dashboard card.

For example, if the dashboard displays:

BTC
ETH
SOL
XRP
ADA
DOGE

retrieve the required market data efficiently.

Prefer batching when supported.

Keep provider specific logic inside the market data service.

Respect API rate limits.

---

# 54. ENVIRONMENT VARIABLES

Market data configuration must not be hardcoded.

Use environment variables for public configuration and secure backend configuration where required.

For example:

VITE_PUBLIC_MARKET_DATA_PROVIDER

If an API key is required and should remain secret:

Do not expose the secret through frontend VITE variables.

Prefer:

Frontend

↓

Supabase Edge Function / secure backend proxy

↓

External market data provider

Never commit API keys to Git.

---

# 55. SIMULATED MARKET ORDER BOOK

The user trading terminal should distinguish between:

### REAL MARKET DATA

Information received from the external market data provider.

and:

### PLATFORM SIMULATED DATA

User orders and trades created within this training platform.

If the selected provider supplies suitable real order book information, it may be displayed as real market reference information.

The platform's own simulated orders must remain separate.

Do not present simulated order book entries as real exchange orders.

---

# 56. DEMO SEED DATA

Create realistic demo seed data during the appropriate stage.

Include:

• Demo users
• Assets
• Trading pairs
• Wallets
• Wallet balances
• Historical simulated trades
• Simulated deposits
• Simulated withdrawals
• Simulated orders
• Transactions
• Notifications

Clearly identify seeded information as demo data.

Do not represent seed data as real user activity.

---

# 57. UX REQUIREMENTS

Every major page must have:

• Loading state
• Skeleton state where appropriate
• Empty state
• Error state
• Success state
• Pending state
• Processing state
• Completed state
• Rejected state
• Cancelled state
• Disabled asset state

Forms must provide useful validation messages.

Use:

• Toast notifications
• Confirmation modals
• Accessible form labels
• Keyboard accessible controls
• Clear focus states
• Semantic HTML
• Good contrast

Include:

• Search
• Filtering
• Pagination
• Date ranges

where appropriate.

---

# 58. REUSABLE COMPONENTS

Create reusable components such as:

• TradingChart
• OrderBook
• RecentTrades
• OrderForm
• MarketSelector
• PortfolioChart
• AssetTable
• TransactionTable
• OrderTable
• AdminTable
• StatCard
• NotificationPanel
• ConfirmationModal
• Toast
• Sidebar
• TopNavigation

Avoid duplicating UI logic across pages.

---

# 59. PERFORMANCE

Avoid unnecessary database queries.

Use:

• Pagination for large datasets
• Appropriate indexes
• Efficient queries
• Reusable data fetching
• Caching
• Limited realtime subscriptions

Only use realtime subscriptions where they provide meaningful value.

Do not create unnecessary realtime listeners.

---

# 60. SECURITY

Never:

• Store plaintext passwords
• Expose Supabase service role keys
• Expose secret credentials
• Put secret API keys in frontend code
• Trust client supplied admin roles
• Allow users to edit balances directly
• Allow users to edit transaction history
• Allow users to access other users' private data
• Allow users to create themselves as admins
• Connect to real financial services
• Send orders to real exchanges

---

# 61. IMPORTANT DEVELOPMENT RULE

DO NOT BUILD THE ENTIRE PLATFORM IN ONE STEP.

Build incrementally.

After every stage:

1. Inspect the existing implementation.
2. Make the required changes.
3. Run the project.
4. Fix TypeScript errors.
5. Fix build errors.
6. Check routing.
7. Check responsive layout.
8. Check that existing functionality still works.
9. Do not remove working functionality unnecessarily.
10. Do not move to the next stage until the current stage is stable.

Do not create fake functionality that appears to work when the backend functionality does not exist.

If a feature has not been implemented yet, use a clearly labelled placeholder or disabled state instead of pretending it works.

Do not hardcode user balances.

Do not hardcode user specific information.

Do not create KYC.

Do not create random market data during the initial architecture stage.

---

# EXECUTION STAGES

The following stages MUST be executed sequentially.

Do not skip stages.

Do not combine all stages into one implementation.

After completing each stage, STOP and wait for the next instruction.

---

# STAGE 1

## PROJECT INSPECTION AND FOUNDATION

First inspect the existing project.

If the project is empty:

• Initialise React + TypeScript + Vite.

Then:

• Install only necessary dependencies
• Configure Tailwind CSS
• Configure Supabase client
• Add environment variable support
• Create project architecture
• Create folders for components, layouts, pages, routes, services, hooks, types and utilities
• Create user routing structure
• Create admin routing structure
• Create separate user layout
• Create separate admin layout
• Create initial authentication structure
• Create reusable UI foundations
• Create TypeScript interfaces/types
• Create placeholder pages for every required route
• Make the application responsive
• Make sure it runs successfully

DO NOT implement the trading engine yet.

DO NOT implement real market data yet unless required only to verify the architecture.

At the end of Stage 1 report:

• Files created
• Dependencies installed
• Routes created
• Supabase configuration required
• What is functional
• What remains for Stage 2

Then STOP.

---

# STAGE 2

## SUPABASE DATABASE AND AUTHENTICATION

Only continue when instructed.

Implement:

• Supabase database schema
• Tables
• Foreign keys
• Indexes
• Constraints
• Profiles
• Roles
• Wallet structure
• RLS
• User registration
• Login
• Logout
• Password reset
• Protected user routes
• Separate admin authentication
• Admin role verification

Test:

• Normal registration
• Normal login
• Logout
• Protected route behavior
• Admin login
• Normal user attempting admin route
• RLS behavior

Do not implement the trading engine yet.

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 3

## USER APPLICATION UI

Build the complete user facing interface and layouts.

Implement:

• Landing page
• Dashboard
• Markets
• Trade terminal UI
• Portfolio
• Orders
• Transactions
• Wallet
• Deposit UI
• Withdrawal UI
• Watchlist
• Notifications
• Settings

Connect read-only database data where appropriate.

Do not fake backend actions.

Make responsive behavior polished.

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 4

## ADMIN APPLICATION UI

Build:

• Admin login
• Admin dashboard
• User management
• Asset management
• Deposits
• Withdrawals
• Orders
• Trades
• Transactions
• Audit log
• Settings

Implement role aware navigation.

Keep admin and user experiences completely separate.

Do not implement dangerous balance mutations until the underlying database functions and audit mechanisms are ready.

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 5

## REAL MARKET DATA INTEGRATION

This stage MUST use real cryptocurrency market data.

Implement:

• Market data provider
• Provider abstraction
• API configuration
• Asset/provider ID mapping
• Current prices
• 24 hour statistics
• Market cap
• Volume
• Historical market data
• OHLC/candlestick data
• Automatic price updates
• Caching
• Rate limit handling
• Loading states
• Error states
• Stale data states
• Provider failure handling

Use real market data for:

• Markets page
• Dashboard market cards
• Trading header
• Trading chart
• Portfolio current prices
• Wallet current values
• Watchlist
• Simulated trading reference prices

Do not connect real trading execution.

Do not create random market prices.

Do not fabricate missing market data.

Test that prices update correctly.

Test provider failure handling.

Test stale market data handling.

At the end:

Report:

• Provider used
• Files created/changed
• API configuration required
• Data being retrieved
• Update method
• Caching strategy
• Rate limit handling
• Tests performed
• Known issues

Then STOP.

---

# STAGE 6

## SIMULATED WALLET AND DEPOSIT SYSTEM

Implement:

• Wallet balances
• Available balance
• Locked balance
• Simulated deposits
• Deposit records
• Transactions
• Notifications
• Admin deposit management
• Admin balance adjustments
• Audit logs

All balance modifications must be atomic and auditable.

Test edge cases including:

• Invalid amount
• Zero amount
• Negative amount
• Large amount
• Duplicate submission
• Insufficient balance where applicable
• Unauthorized user
• Unauthorized admin action

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 7

## SIMULATED TRADING ENGINE

Implement:

• Market orders
• Limit orders
• Stop orders
• Order validation
• Balance validation
• Balance locking
• Order execution
• Order cancellation
• Trade creation
• Fee calculation
• Transaction creation
• Portfolio updates
• Notifications

Use the latest valid real market price as the reference for simulated market orders.

Ensure no real order is sent to an exchange.

Test:

• Buy
• Sell
• Insufficient balance
• Invalid amount
• Invalid price
• Market order
• Limit order
• Stop order
• Cancel order
• Fee calculation
• Duplicate submission
• Price update during order processing

Ensure there is no duplicate execution or balance mutation.

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 8

## SIMULATED WITHDRAWALS

Implement:

• Withdrawal form
• Validation
• Simulated network fee
• Withdrawal record
• Transaction record
• Balance handling
• Notifications
• Admin approval
• Admin rejection
• Processing state
• Completed state
• Audit logging

No real blockchain transaction.

Test:

• Valid withdrawal
• Insufficient balance
• Invalid amount
• Invalid destination/reference
• Disabled asset
• Admin rejection
• Admin approval
• Duplicate submission

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 9

## PORTFOLIO, P/L AND ANALYTICS

Implement accurate calculations for:

• Total portfolio value
• Available cash
• Invested value
• Average entry price
• Unrealised P/L
• Realised P/L
• Asset allocation
• Performance history
• Trading volume

Current asset values must use real market prices.

Ensure:

• Portfolio values update when market prices change
• Unrealised P/L updates correctly
• Realised P/L is calculated from completed simulated trades
• Fees are accounted for correctly

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 10

## ADMIN OPERATIONS AND AUDITING

Complete:

• User suspension/reactivation
• Balance adjustments
• Asset listing/delisting
• Deposit management
• Withdrawal management
• Order management
• Transaction ledger
• Audit logs
• Super Admin controls
• Platform configuration
• Simulated fee configuration

Every sensitive action must be audited.

Test:

• Admin permissions
• Super Admin permissions
• Unauthorized access
• Audit record creation
• Asset delisting
• Historical data preservation
• Balance adjustment auditing

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 11

## POLISH, RESPONSIVENESS AND ACCESSIBILITY

Review the entire application.

Improve:

• Mobile responsiveness
• Tablet responsiveness
• Desktop layout
• Loading states
• Empty states
• Error states
• Toasts
• Modals
• Form validation
• Accessibility
• Keyboard navigation
• Focus states
• Typography
• Spacing
• Table responsiveness
• Chart usability
• Navigation
• Performance

Remove unnecessary visual clutter.

Maintain the professional exchange aesthetic.

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 12

## SECURITY, RLS AND DATA INTEGRITY AUDIT

Perform a full security review.

Check:

• RLS policies
• Role enforcement
• Admin authorization
• User isolation
• Balance mutation security
• Transaction security
• Order security
• Withdrawal security
• Secret handling
• Environment variables
• Frontend exposure
• Unauthorized route access
• Client side role manipulation
• Duplicate transactions
• Duplicate balance changes
• Invalid state transitions
• Admin privilege escalation

Fix discovered issues.

At the end:

Report changes, tests, known issues and next stage.

Then STOP.

---

# STAGE 13

## FINAL TESTING AND CLEANUP

Perform a complete end to end review.

## AUTH

Verify:

• Registration works
• Login works
• Logout works
• Password reset works
• Protected routes work

## USER

Verify:

• Dashboard works
• Markets work
• Real market prices display
• Prices update
• Trading UI works
• Portfolio works
• Orders work
• Transactions work
• Wallet works
• Deposits work
• Withdrawals work
• Watchlist works
• Notifications work
• Settings work

## ADMIN

Verify:

• Admin login works
• Normal user cannot access admin
• Admin dashboard works
• User management works
• Asset management works
• Deposit management works
• Withdrawal management works
• Order management works
• Trade management works
• Transaction ledger works
• Audit log works
• Super Admin permissions work

## MARKET DATA

Verify:

• Current prices are real market data
• Market data updates
• Historical charts use real market data
• Provider errors are handled
• Rate limits are respected
• Stale data is identified
• No random replacement prices are generated
• API credentials are protected

## DATA

Verify:

• RLS works
• Balances remain consistent
• Orders remain consistent
• Trades remain consistent
• Transactions remain consistent
• Historical records remain after asset delisting
• Audit records remain immutable through normal UI

## DEMO SAFETY

Verify:

• No real financial transactions
• No real blockchain withdrawals
• No real payment processors
• No real exchange execution
• No real crypto custody
• Demo label is visible
• KYC has NOT been implemented

Then:

• Remove dead code
• Remove unnecessary dependencies
• Fix TypeScript errors
• Fix build errors
• Fix console errors
• Improve naming
• Improve component structure
• Verify environment configuration
• Verify production build

---

# FINAL RESPONSE FORMAT AFTER EACH STAGE

After completing each stage, report only:

STAGE COMPLETED:
[stage name]

FILES CREATED/CHANGED:
[list]

DEPENDENCIES:
[list]

FUNCTIONAL:
[list]

NOT YET IMPLEMENTED:
[list]

TESTS PERFORMED:
[list]

ISSUES:
[list]

NEXT STAGE:
[stage name]

Then STOP and wait for the next instruction.

---

# MOST IMPORTANT RULES

1. Build one stage at a time.
2. Do not skip stages.
3. Do not combine all stages into one implementation.
4. Do not build the entire application in one response.
5. Do not create fake functionality.
6. Do not create KYC.
7. Do not connect real financial services.
8. Do not send real exchange orders.
9. Use real market prices and real market data.
10. Keep all user balances and trading activity simulated.
11. Do not hardcode user balances.
12. Do not hardcode user specific data.
13. Do not expose secrets.
14. Do not trust frontend role checks.
15. Use Supabase RLS.
16. Keep admin and user applications completely separate.
17. Preserve existing working functionality when modifying the project.
18. Run and test the project after every stage.
19. Fix errors before moving forward.
20. Handle market data failures safely.
21. Never replace unavailable real market prices with random fabricated prices.
22. After every stage, stop and wait for the next instruction.
23. Start with STAGE 1 only.

## START NOW

Inspect the existing project and begin **STAGE 1 ONLY**.

Do not continue to Stage 2 until instructed.
