<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Loading...',
  size: 'md'
})

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-8 h-8'
    case 'lg':
      return 'w-20 h-20'
    default:
      return 'w-16 h-16'
  }
})

const textSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm'
    case 'lg':
      return 'text-lg'
    default:
      return 'text-base'
  }
})
</script>

<template>
  <div class="relative z-10 min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div 
        class="border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
        :class="spinnerSize"
      ></div>
      <p 
        class="text-gray-600 dark:text-gray-400 font-medium"
        :class="textSize"
      >
        {{ message }}
      </p>
    </div>
  </div>
</template>
