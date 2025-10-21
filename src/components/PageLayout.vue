<script setup lang="ts">
import { computed } from 'vue'
import LoadingState from './LoadingState.vue'

interface Props {
  loading?: boolean
  loadingMessage?: string
  loadingSize?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingMessage: 'Loading...',
  loadingSize: 'md',
  class: ''
})

const containerClasses = computed(() => {
  const baseClasses = 'min-h-screen relative'
  return props.class ? `${baseClasses} ${props.class}` : baseClasses
})
</script>

<template>
  <div :class="containerClasses">
    <!-- Loading State -->
    <LoadingState 
      v-if="loading"
      :message="loadingMessage"
      :size="loadingSize"
    />
    
    <!-- Page Content -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>
