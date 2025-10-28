import type { User, Profile, Presence } from '../../../shared/types.js'
import { BaseManager } from './BaseManager.js'

interface PresenceData {
  user: User
  context: string
  contextId: string | null
  eventData: Record<string, any>
  lastSeen: number
  lastActivity: number
  socketId: string
}

export class PresenceManager extends BaseManager {
  private static readonly MAX_PRESENCE_ENTRIES = 10000
  private static readonly PRESENCE_CLEANUP_INTERVAL = 60000 // 1 minute
  private static readonly PRESENCE_MAX_AGE = 300000 // 5 minutes
  private static readonly MAX_PROFILE_CACHE = 5000
  
  // Ключ: `${socketId}:${context}:${contextId || ''}`
  private presence = new Map<string, PresenceData>()
  // socketId -> Set of context keys
  private socketToContexts = new Map<string, Set<string>>()
  private profiles = new Map<string, Profile>()
  private cleanupInterval?: NodeJS.Timeout

  constructor() {
    super()
    this.cleanupInterval = setInterval(
      () => this.performCleanup(),
      PresenceManager.PRESENCE_CLEANUP_INTERVAL
    )
  }

  /**
   * Добавить пользователя в presence контекст
   */
  async add(
    socketId: string, 
    user: User, 
    context: string, 
    contextId: string | null = null,
    eventData: Record<string, any> = {}
  ): Promise<Presence[]> {
    // Проверяем, есть ли уже присутствие для этого пользователя в этом контексте
    const existingKey = this.findExistingKey(user.id, context, contextId)
    if (existingKey) {
      // Если найден старый entry с другим socketId, удаляем его
      const oldData = this.presence.get(existingKey)
      if (oldData && oldData.socketId !== socketId) {
        const oldContexts = this.socketToContexts.get(oldData.socketId)
        oldContexts?.delete(existingKey)
        if (oldContexts?.size === 0) {
          this.socketToContexts.delete(oldData.socketId)
        }
        this.presence.delete(existingKey)
      }
    }
    
    const contextKey = this.getContextKey(socketId, context, contextId)
    const now = Date.now()
    
    // Обновляем маппинг socket -> contexts
    if (!this.socketToContexts.has(socketId)) {
      this.socketToContexts.set(socketId, new Set())
    }
    this.socketToContexts.get(socketId)!.add(contextKey)
    
    // Добавляем/обновляем presence
    this.presence.set(contextKey, {
      user,
      context,
      contextId,
      eventData,
      lastSeen: now,
      lastActivity: now,
      socketId
    })
    
    // Загружаем профиль если нужно
    await this.fetchProfile(user.id)
    
    return this.getByContext(context, contextId)
  }

  /**
   * Обновить presence
   */
  update(
    socketId: string, 
    context: string, 
    contextId: string | null,
    eventData: Record<string, any>
  ): boolean {
    const contextKey = this.getContextKey(socketId, context, contextId)
    const data = this.presence.get(contextKey)
    
    if (!data) return false
    
    data.eventData = { ...data.eventData, ...eventData }
    data.lastSeen = Date.now()
    return true
  }

  /**
   * Удалить пользователя из контекста
   */
  remove(
    socketId: string, 
    context: string, 
    contextId: string | null = null
  ): Presence[] | null {
    const contextKey = this.getContextKey(socketId, context, contextId)
    const removed = this.presence.delete(contextKey)
    
    if (removed) {
      const contexts = this.socketToContexts.get(socketId)
      contexts?.delete(contextKey)
      if (contexts?.size === 0) {
        this.socketToContexts.delete(socketId)
      }
      
      this.cleanupProfiles()
      return this.getByContext(context, contextId)
    }
    
    return null
  }

  /**
   * Принудительно удалить все presence для socket (при закрытии соединения)
   */
  forceRemove(socketId: string): Array<{ context: string; contextId: string | null; users: Presence[] }> {
    const results: Array<{ context: string; contextId: string | null; users: Presence[] }> = []
    const contexts = this.socketToContexts.get(socketId)
    
    if (!contexts) return results
    
    // Собираем все контексты для этого socket
    const contextsToRemove = Array.from(contexts)
    
    for (const contextKey of contextsToRemove) {
      const data = this.presence.get(contextKey)
      if (!data) continue
      
      const users = this.remove(socketId, data.context, data.contextId)
      if (users) {
        results.push({
          context: data.context,
          contextId: data.contextId,
          users
        })
      }
    }
    
    this.cleanupProfiles()
    return results
  }

  /**
   * Получить всех пользователей для контекста
   */
  getByContext(context: string, contextId: string | null = null): Presence[] {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const thirtySecondsAgo = Date.now() - 30 * 1000
    
    const presenceList: Presence[] = []
    
    for (const [key, data] of this.presence.entries()) {
      if (data.context !== context) continue
      if (data.contextId !== contextId) continue
      if (data.lastSeen < fiveMinutesAgo) continue
      
      const profile = this.profiles.get(data.user.id)
      presenceList.push({
        user_id: data.user.id,
        context: data.context,
        context_id: data.contextId,
        last_seen: new Date(data.lastSeen).toISOString(),
        last_activity: new Date(data.lastActivity).toISOString(),
        is_active: data.lastActivity > thirtySecondsAgo,
        event_data: data.eventData,
        profile: profile || this.createFallbackProfile(data.user)
      })
    }
    
    return presenceList
  }

  /**
   * Проверить, находится ли пользователь в контексте
   */
  isUserInContext(userId: string, context: string, contextId: string | null = null): boolean {
    for (const data of this.presence.values()) {
      if (data.user.id === userId && 
          data.context === context && 
          data.contextId === contextId) {
        return true
      }
    }
    return false
  }

  /**
   * Получить все контексты пользователя
   */
  getUserContexts(userId: string): Array<{ context: string; contextId: string | null }> {
    const contextsMap = new Map<string, { context: string; contextId: string | null }>()
    
    for (const data of this.presence.values()) {
      if (data.user.id === userId) {
        const key = `${data.context}:${data.contextId || ''}`
        if (!contextsMap.has(key)) {
          contextsMap.set(key, { context: data.context, contextId: data.contextId })
        }
      }
    }
    
    return Array.from(contextsMap.values())
  }

  /**
   * Получить socket ID для пользователя в контексте
   */
  getSocketId(userId: string, context: string, contextId: string | null = null): string | null {
    for (const [key, data] of this.presence.entries()) {
      if (data.user.id === userId && 
          data.context === context && 
          data.contextId === contextId) {
        return data.socketId
      }
    }
    return null
  }

  // Profile management
  protected async fetchProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error(`[PresenceManager] Profile fetch error for ${userId}:`, error)
      }
      
      if (data) {
        this.profiles.set(userId, data)
      }
    } catch (err) {
      console.error(`[PresenceManager] Profile fetch exception for ${userId}:`, err)
    }
  }

  async refreshProfile(userId: string): Promise<void> {
    await this.fetchProfile(userId)
  }

  protected getProfile(userId: string): Profile | undefined {
    return this.profiles.get(userId)
  }

  protected cleanupProfiles(): void {
    const activeUserIds = new Set<string>()
    for (const data of this.presence.values()) {
      activeUserIds.add(data.user.id)
    }
    
    const profilesToRemove: string[] = []
    this.profiles.forEach((_, userId) => {
      if (!activeUserIds.has(userId)) {
        profilesToRemove.push(userId)
      }
    })
    
    profilesToRemove.forEach(userId => this.profiles.delete(userId))
    
    if (this.profiles.size > PresenceManager.MAX_PROFILE_CACHE) {
      const excess = this.profiles.size - PresenceManager.MAX_PROFILE_CACHE
      const keys = Array.from(this.profiles.keys())
      keys.slice(0, excess).forEach(key => this.profiles.delete(key))
    }
  }

  protected createFallbackProfile(user: User): Profile {
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url || null
    }
  }

  private getContextKey(socketId: string, context: string, contextId: string | null): string {
    return `${socketId}:${context}:${contextId || ''}`
  }

  private findExistingKey(userId: string, context: string, contextId: string | null): string | null {
    for (const [key, data] of this.presence.entries()) {
      if (data.user.id === userId && 
          data.context === context && 
          data.contextId === contextId) {
        return key
      }
    }
    return null
  }

  private performCleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    // Remove stale entries
    for (const [key, data] of this.presence.entries()) {
      if (now - data.lastSeen > PresenceManager.PRESENCE_MAX_AGE) {
        keysToDelete.push(key)
        const contexts = this.socketToContexts.get(data.socketId)
        contexts?.delete(key)
        if (contexts?.size === 0) {
          this.socketToContexts.delete(data.socketId)
        }
      }
    }

    keysToDelete.forEach(key => this.presence.delete(key))

    // Emergency: if still over capacity, remove oldest
    if (this.presence.size > PresenceManager.MAX_PRESENCE_ENTRIES) {
      const entries = Array.from(this.presence.entries())
      entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen)
      const toRemove = entries.slice(0, this.presence.size - PresenceManager.MAX_PRESENCE_ENTRIES)
      toRemove.forEach(([key, data]) => {
        this.presence.delete(key)
        const contexts = this.socketToContexts.get(data.socketId)
        contexts?.delete(key)
        if (contexts?.size === 0) {
          this.socketToContexts.delete(data.socketId)
        }
      })
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
    this.presence.clear()
    this.socketToContexts.clear()
    this.profiles.clear()
  }
}

