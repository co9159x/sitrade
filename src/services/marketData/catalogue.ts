import type { DeskAsset } from '@/services/desk'

/** Training catalogue used only when the database is not connected. Provider IDs match the asset seed. */
export const trainingCatalogue: DeskAsset[] = [
  { id: 'cfg-bitcoin', symbol: 'BTC', name: 'Bitcoin', providerAssetId: 'bitcoin', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-ethereum', symbol: 'ETH', name: 'Ethereum', providerAssetId: 'ethereum', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-solana', symbol: 'SOL', name: 'Solana', providerAssetId: 'solana', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-ripple', symbol: 'XRP', name: 'XRP', providerAssetId: 'ripple', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-cardano', symbol: 'ADA', name: 'Cardano', providerAssetId: 'cardano', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-dogecoin', symbol: 'DOGE', name: 'Dogecoin', providerAssetId: 'dogecoin', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-tether', symbol: 'USDT', name: 'Tether', providerAssetId: 'tether', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-binancecoin', symbol: 'BNB', name: 'BNB', providerAssetId: 'binancecoin', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-avalanche', symbol: 'AVAX', name: 'Avalanche', providerAssetId: 'avalanche-2', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-polkadot', symbol: 'DOT', name: 'Polkadot', providerAssetId: 'polkadot', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
  { id: 'cfg-chainlink', symbol: 'LINK', name: 'Chainlink', providerAssetId: 'chainlink', quoteCurrency: 'GBP', tradingEnabled: false, depositsEnabled: false, withdrawalsEnabled: false, withdrawalFee: 0 },
]
