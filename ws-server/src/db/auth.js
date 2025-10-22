import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

/**
 * Authentication Client (KISS Architecture)
 * 
 * Handles only authentication operations
 */

class AuthClient {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceKey)
  }

  /**
   * Sign in user
   */
  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  /**
   * Sign up user
   */
  async signUp(email, password, fullName) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
    return data
  }

  /**
   * Verify token
   */
  async verifyToken(token) {
    const { data, error } = await this.supabase.auth.getUser(token)
    if (error) throw error
    return data
  }

  /**
   * Get user data by token
   */
  async getUser(token) {
    const { data, error } = await this.supabase.auth.getUser(token)
    if (error) throw error
    return data.user
  }
}

// Export singleton instance
export const authClient = new AuthClient()
