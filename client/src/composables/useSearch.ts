import { ref } from 'vue'

// Shared search query state across all components
const searchQuery = ref('')

export function useSearch() {
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const clearSearch = () => {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    setSearchQuery,
    clearSearch
  }
}
