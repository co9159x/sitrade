import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

function rpcError(error: { message: string }) {
  const message = error.message.replace(/^.*Exception:\s*/i, '')
  return message || 'The action was rejected.'
}

function requireConfigured(message: string) {
  if (!isSupabaseConfigured()) throw new Error(message)
}

export async function adminSetAccountStatus(userId: string, status: 'active' | 'suspended', note: string) {
  requireConfigured('Supabase is not configured, so the account status was not changed.')
  const { error } = await getSupabase().rpc('admin_set_account_status', {
    target_user: userId,
    next_status: status,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}

export async function adminSetAssetState(
  assetId: string,
  action: 'list' | 'delist' | 'enable_trading' | 'disable_trading' | 'enable_deposits' | 'disable_deposits' | 'enable_withdrawals' | 'disable_withdrawals',
  note: string,
) {
  requireConfigured('Supabase is not configured, so the asset was not changed.')
  const { error } = await getSupabase().rpc('admin_set_asset_state', {
    target_asset: assetId,
    asset_action: action,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}

export async function adminUpdateAssetTerms(assetId: string, minOrder: number, withdrawalFee: number, note: string) {
  requireConfigured('Supabase is not configured, so the asset terms were not changed.')
  const { error } = await getSupabase().rpc('admin_update_asset_terms', {
    target_asset: assetId,
    next_min_order: minOrder,
    next_withdrawal_fee: withdrawalFee,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}

export async function adminCancelOrder(orderId: string, note: string) {
  requireConfigured('Supabase is not configured, so the order was not cancelled.')
  const { error } = await getSupabase().rpc('admin_cancel_order', {
    target_order: orderId,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}

export async function superAdminSetRole(userId: string, role: 'user' | 'admin', note: string) {
  requireConfigured('Supabase is not configured, so the role was not changed.')
  const { error } = await getSupabase().rpc('super_admin_set_role', {
    target_user: userId,
    next_role: role,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}

export async function superAdminSetFees(takerFee: number, makerFee: number, note: string) {
  requireConfigured('Supabase is not configured, so the fees were not changed.')
  const { error } = await getSupabase().rpc('super_admin_set_fees', {
    next_taker_fee: takerFee,
    next_maker_fee: makerFee,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}

export async function loadPlatformFees() {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await getSupabase().from('platform_settings').select('taker_fee_rate, maker_fee_rate').eq('id', 1).maybeSingle()
  if (error || !data) return null
  const taker = Number(data.taker_fee_rate)
  const maker = Number(data.maker_fee_rate)
  if (!Number.isFinite(taker) || !Number.isFinite(maker)) return null
  return { taker, maker }
}
