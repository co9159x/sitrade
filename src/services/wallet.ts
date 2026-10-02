import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

export const maxTrainingAmount = 1_000_000_000

export function validateTrainingAmount(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return 'Enter an amount.'
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return 'Enter a valid amount.'
  if (value === 0) return 'Enter an amount greater than zero.'
  if (value < 0) return 'Amount cannot be negative.'
  if (value > maxTrainingAmount) return 'That amount is too large for a training deposit.'
  return null
}

function rpcError(error: { message: string }) {
  const message = error.message.replace(/^.*Exception:\s*/i, '')
  return message || 'The wallet update was rejected.'
}

export async function submitSimulatedDeposit(assetId: string, amount: number, requestToken: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured, so no balance was changed.')
  const { data, error } = await getSupabase().rpc('submit_simulated_deposit', {
    target_asset: assetId,
    deposit_amount: amount,
    request_token: requestToken,
  })
  if (error) throw new Error(rpcError(error))
  if (typeof data !== 'string') throw new Error('The deposit did not return a record id.')
  return data
}

export async function adminAdjustBalance(input: {
  userId: string
  assetId: string
  amount: number
  direction: 'add' | 'remove'
  note: string
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured, so no balance was changed.')
  const { error } = await getSupabase().rpc('admin_adjust_balance', {
    target_user: input.userId,
    target_asset: input.assetId,
    adjustment_amount: input.amount,
    direction: input.direction,
    adjustment_note: input.note,
  })
  if (error) throw new Error(rpcError(error))
}

export function validateDestination(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return 'Enter a destination reference.'
  if (trimmed.length < 3 || trimmed.length > 120) return 'Enter a destination reference between 3 and 120 characters.'
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return 'Enter a valid destination reference.'
  return null
}

export async function submitSimulatedWithdrawal(assetId: string, amount: number, destination: string, requestToken: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured, so no balance was reserved.')
  const { data, error } = await getSupabase().rpc('submit_simulated_withdrawal', {
    target_asset: assetId,
    withdrawal_amount: amount,
    destination_reference: destination,
    request_token: requestToken,
  })
  if (error) throw new Error(rpcError(error))
  if (typeof data !== 'string') throw new Error('The withdrawal did not return a record id.')
  return data
}

export async function adminReviewWithdrawal(withdrawalId: string, decision: 'processing' | 'approve' | 'reject', note: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured, so the withdrawal was not changed.')
  const { error } = await getSupabase().rpc('admin_review_withdrawal', {
    target_withdrawal: withdrawalId,
    decision,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}

export async function adminReviewDeposit(depositId: string, decision: 'approve' | 'reject', note: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured, so the deposit was not changed.')
  const { error } = await getSupabase().rpc('admin_review_deposit', {
    target_deposit: depositId,
    decision,
    review_note: note,
  })
  if (error) throw new Error(rpcError(error))
}
