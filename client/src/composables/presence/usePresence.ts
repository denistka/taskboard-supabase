import { usePresenceContext } from './usePresenceContext'

// Cache для хранения контекстов
const contextCache = new Map<string, ReturnType<typeof usePresenceContext>>()

/**
 * Universal presence composable with unified API
 * 
 * Usage:
 * const presence = usePresence()
 * 
 * // Получить контекст для любого ключа
 * const app = presence.context('app')
 * app.users.value
 * await app.fetch()
 * await app.join(null)
 * 
 * const board = presence.context('board')
 * await board.join(boardId)
 * 
 * // Любые другие контексты
 * presence.context('special').join(specialId)
 * presence.context('chat-room').join(roomId)
 */
export function usePresence() {
  /**
   * Получить или создать presence context для любого ключа
   */
  const context = (key: string) => {
    if (!contextCache.has(key)) {
      const ctx = usePresenceContext(key)
      contextCache.set(key, ctx)
      // Автоматически подписываемся на события
      ctx.subscribe()
    }
    return contextCache.get(key)!
  }

  return {
    /**
     * Получить presence context для произвольного ключа
     * Поддерживает любые контексты: 'app', 'board', 'special', 'chat-room', и т.д.
     */
    context,

    /**
     * Удобные обёртки для стандартных контекстов
     */
    app: {
      get users() { return context('app').users },
      fetch: () => context('app').fetch(null),
      join: () => context('app').join(null),
      leave: () => context('app').leave(null),
      subscribe: () => context('app').subscribe(),
      unsubscribe: () => context('app').unsubscribe()
    },

    board: {
      get users() { return context('board').users },
      fetch: (boardId: string) => context('board').fetch(boardId),
      join: (boardId: string) => context('board').join(boardId),
      leave: (boardId: string) => context('board').leave(boardId),
      leaveCurrent: () => context('board').leaveCurrent(),
      getCurrentId: () => context('board').currentContextId.value,
      subscribe: () => context('board').subscribe(),
      unsubscribe: () => context('board').unsubscribe()
    },

    /**
     * Покинуть все контексты
     * Useful when user signs out
     */
    leaveAll: async () => {
      for (const ctx of contextCache.values()) {
        await ctx.leaveCurrent()
      }
    },

    /**
     * Проверить, находится ли пользователь на доске
     */
    isOnBoard: () => context('board').currentContextId.value !== null
  }
}

