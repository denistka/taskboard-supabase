import { onUnmounted } from 'vue'

/**
 * Manages cleanup operations for subscriptions, intervals, and timeouts
 */
export const useCleanup = () => {
  const cleanupFunctions: (() => void)[] = []

  /**
   * Registers a cleanup function to be called on unmount
   */
  const registerCleanup = (cleanupFn: () => void) => {
    cleanupFunctions.push(cleanupFn)
  }

  /**
   * Creates a managed interval that auto-cleans on unmount
   */
  const createManagedInterval = (callback: () => void, ms: number): ReturnType<typeof setInterval> => {
    const intervalId = setInterval(callback, ms)
    registerCleanup(() => clearInterval(intervalId))
    return intervalId
  }

  /**
   * Creates a managed timeout that auto-cleans on unmount
   */
  const createManagedTimeout = (callback: () => void, ms: number): ReturnType<typeof setTimeout> => {
    const timeoutId = setTimeout(callback, ms)
    registerCleanup(() => clearTimeout(timeoutId))
    return timeoutId
  }

  /**
   * Creates a managed Supabase channel subscription
   */
  const createManagedChannel = (channel: any) => {
    registerCleanup(() => {
      if (channel) {
        channel.unsubscribe()
      }
    })
    return channel
  }

  /**
   * Manually trigger all cleanup functions
   */
  const cleanup = () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Error during cleanup:', error)
      }
    })
    cleanupFunctions.length = 0
  }

  // Auto-cleanup on unmount when used in components
  onUnmounted(cleanup)

  return {
    registerCleanup,
    createManagedInterval,
    createManagedTimeout,
    createManagedChannel,
    cleanup
  }
}

