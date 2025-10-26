import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { config } from '../config.js'

export abstract class BaseManager {
  protected supabase: SupabaseClient

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceKey)
  }

  protected async verifyToken(token?: string) {
    if (!token) return null
    const { data: { user }, error } = await this.supabase.auth.getUser(token)
    return error ? null : user
  }
}
