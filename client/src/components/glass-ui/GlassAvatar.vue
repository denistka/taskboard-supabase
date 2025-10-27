<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  initials?: string
  color?: string
  isActive?: boolean
  showIndicator?: boolean
  isInactive?: boolean
}

withDefaults(defineProps<Props>(), {
  src: '',
  alt: '',
  size: 'md',
  initials: '',
  color: 'bg-primary-500',
  isActive: true,
  showIndicator: false,
  isInactive: false
})

const imageError = ref(false)

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
}

const indicatorSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4'
}

const handleImageError = () => {
  imageError.value = true
}
</script>

<template>
  <div class="relative inline-block">
    <div 
      :class="[
        'rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ring-2 ring-white dark:ring-gray-900',
        sizeClasses[size],
        src ? '' : `${color} text-white font-semibold`,
        isInactive ? 'opacity-50' : 'opacity-100'
      ]"
    >
      <img 
        v-if="src && !imageError" 
        :src="src" 
        :alt="alt" 
        class="w-full h-full object-cover" 
        @error="handleImageError"
      />
      <span v-else-if="imageError || initials">{{ initials }}</span>
      <svg v-else class="w-full h-full p-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </div>
    
    <!-- Activity Indicator -->
    <div
      v-if="showIndicator"
      :class="[
        'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900 transition-colors duration-300',
        indicatorSizeClasses[size],
        isActive ? 'bg-green-500' : 'bg-gray-400'
      ]"
    />
  </div>
</template>
