import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const rememberKey = 'sitrade.remember'

let client: SupabaseClient | null = null

export function isSupabaseConfigured() {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0
}

export function setRememberPreference(remember: boolean) {
  localStorage.setItem(rememberKey, remember ? 'true' : 'false')
}

function rememberEnabled() {
  return localStorage.getItem(rememberKey) !== 'false'
}

const authStorage = {
  getItem(key: string) {
    return (rememberEnabled() ? localStorage : sessionStorage).getItem(key)
  },
  setItem(key: string, value: string) {
    const active = rememberEnabled() ? localStorage : sessionStorage
    const inactive = rememberEnabled() ? sessionStorage : localStorage
    active.setItem(key, value)
    inactive.removeItem(key)
  },
  removeItem(key: string) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.')
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return client
}
