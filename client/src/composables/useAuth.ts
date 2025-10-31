import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket'
import type { User } from '../../../shared/types'

const user = ref<User | null>(null)
const token = ref<string | null>(null)
const initialized = ref(false)

export function useAuth() {
  const { send } = useWebSocket()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  const signIn = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const result = await send<{ user: User; token: string }>('auth:signin', { email, password })
      user.value = result.user
      token.value = result.token
      localStorage.setItem('token', result.token)
      initialized.value = true
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    loading.value = true
    error.value = null
    try {
      const result = await send<{ user: User; token: string }>('auth:signup', { email, password, fullName })
      user.value = result.user
      token.value = result.token
      if (result.token) {
        localStorage.setItem('token', result.token)
      }
      initialized.value = true
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const signOut = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  const verify = async () => {
    const savedToken = localStorage.getItem('token')
    if (!savedToken) {
      initialized.value = true
      return
    }

    try {
      const result = await send<{ user: User }>('auth:verify', {}, savedToken)
      user.value = result.user
      token.value = savedToken
    } catch (err) {
      signOut()
    } finally {
      initialized.value = true
    }
  }

  const getToken = () => token.value

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    verify,
    getToken
  }
}
