<script setup lang="ts">
import { useSearch } from '../../composables/useSearch'
import { uiInput } from '../common/ui'
import { IconSearch } from '../common/icons'

interface Props {
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Search...'
})

const { searchQuery } = useSearch()
</script>

<template>
  <div class="relative flex-1">
    <icon-search 
      :size="16" 
      class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10"
    />
    <ui-input
      v-model="searchQuery"
      type="text"
      size="sm"
      :placeholder="placeholder"
      class="pl-10 w-full"
    />
  </div>
</template>

