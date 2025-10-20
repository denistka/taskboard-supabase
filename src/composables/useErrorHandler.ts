import { useNotifications } from './useNotifications'

export const useErrorHandler = () => {
  const { showError } = useNotifications()

  /**
   * Handles errors consistently across the application
   */
  const handleError = (
    error: unknown,
    context: string,
    showToUser = true
  ): string => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    console.error(`Error in ${context}:`, error)
    
    if (showToUser) {
      showError(`${context} Failed`, errorMessage)
    }
    
    return errorMessage
  }

  /**
   * Handles database errors with specific handling for common cases
   */
  const handleDatabaseError = (
    error: any,
    context: string,
    showToUser = true
  ): { message: string; code?: string; isConflict: boolean } => {
    const errorMessage = error?.message || 'Database operation failed'
    const errorCode = error?.code
    
    // Check for version conflict
    const isConflict = errorCode === 'PGRST116' || 
                       errorMessage.includes('version') ||
                       errorMessage.includes('modified by another user')
    
    console.error(`Database error in ${context}:`, error)
    
    if (showToUser) {
      if (isConflict) {
        showError(
          'Conflict Detected',
          'This item was modified by another user. Please refresh and try again.'
        )
      } else {
        showError(`${context} Failed`, errorMessage)
      }
    }
    
    return { 
      message: errorMessage, 
      code: errorCode,
      isConflict 
    }
  }

  /**
   * Safe async operation wrapper with error handling
   */
  const safeAsync = async <T>(
    operation: () => Promise<T>,
    context: string,
    fallback: T,
    showToUser = true
  ): Promise<T> => {
    try {
      return await operation()
    } catch (error) {
      handleError(error, context, showToUser)
      return fallback
    }
  }

  return {
    handleError,
    handleDatabaseError,
    safeAsync
  }
}

