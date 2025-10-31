import { BaseManager } from './BaseManager.js'

export class AuthManager extends BaseManager {
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return {
      user: data.user,
      token: data.session.access_token
    }
  }

  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) throw error
    return {
      user: data.user,
      token: data.session?.access_token
    }
  }

  async verify(token: string) {
    const user = await this.verifyToken(token)
    if (!user) throw new Error('Not authenticated')
    return { user }
  }
}
