insert into public.assets (symbol, name, provider_asset_id, quote_currency, listed, trading_enabled, deposits_enabled, withdrawals_enabled)
values
  ('BTC', 'Bitcoin', 'bitcoin', 'GBP', true, false, false, false),
  ('ETH', 'Ethereum', 'ethereum', 'GBP', true, false, false, false),
  ('SOL', 'Solana', 'solana', 'GBP', true, false, false, false),
  ('XRP', 'XRP', 'ripple', 'GBP', true, false, false, false),
  ('ADA', 'Cardano', 'cardano', 'GBP', true, false, false, false),
  ('DOGE', 'Dogecoin', 'dogecoin', 'GBP', true, false, false, false),
  ('USDT', 'Tether', 'tether', 'GBP', true, false, false, false),
  ('BNB', 'BNB', 'binancecoin', 'GBP', true, false, false, false),
  ('AVAX', 'Avalanche', 'avalanche-2', 'GBP', true, false, false, false),
  ('DOT', 'Polkadot', 'polkadot', 'GBP', true, false, false, false),
  ('LINK', 'Chainlink', 'chainlink', 'GBP', true, false, false, false)
on conflict (symbol) do update
set
  name = excluded.name,
  provider_asset_id = excluded.provider_asset_id;
