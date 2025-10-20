export const useFormatters = () => {
  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) { // Less than 1 minute
      return 'now'
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m`
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000)
      return `${hours}h`
    } else {
      const days = Math.floor(diff / 86400000)
      return `${days}d`
    }
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getUserInitials = (user: { name: string; avatar?: string }): string | null => {
    if (user.avatar) return null
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return {
    formatTime,
    formatDate,
    formatDateTime,
    getUserInitials
  }
}

