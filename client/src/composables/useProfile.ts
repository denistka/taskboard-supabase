import { ref } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { Profile, ProfileStats } from '../../../shared/types'

export function useProfile() {
  const { send } = useWebSocket()
  const { getToken } = useAuth()
  
  const profile = ref<Profile | null>(null)
  const stats = ref<ProfileStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await send<{ profile: Profile }>('profile:get', {}, getToken()!)
      profile.value = result.profile
      return result.profile
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    loading.value = true
    error.value = null
    try {
      const result = await send<{ profile: Profile }>('profile:update', { updates }, getToken()!)
      profile.value = result.profile
      return result.profile
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await send<{ stats: ProfileStats }>('profile:stats', {}, getToken()!)
      stats.value = result.stats
      return result.stats
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    stats,
    loading,
    error,
    fetchProfile,
    updateProfile,
    fetchStats
  }
}
