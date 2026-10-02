import type { AccountStatus, Profile, UserRole } from '@/types'
import { getSupabase } from '@/lib/supabase'

type RoleEmbed = { name: UserRole } | { name: UserRole }[] | null

type ProfileQuery = {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  status: AccountStatus
  created_at: string
  updated_at: string
  roles: RoleEmbed
}

function readRole(roles: RoleEmbed): UserRole {
  const name = Array.isArray(roles) ? roles[0]?.name : roles?.name
  if (name === 'admin' || name === 'super_admin' || name === 'user') return name
  return 'user'
}

export function isOperator(role: UserRole | null | undefined) {
  return role === 'admin' || role === 'super_admin'
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, status, created_at, updated_at, roles(name)')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as ProfileQuery
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    role: readRole(row.roles),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
