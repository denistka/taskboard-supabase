<script setup lang="ts">
interface Props {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  initials?: string
  color?: string
}

withDefaults(defineProps<Props>(), {
  src: '',
  alt: '',
  size: 'md',
  initials: '',
  color: 'bg-primary-500'
})

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
}
</script>

<template>
  <div 
    :class="[
      'rounded-full flex items-center justify-center overflow-hidden',
      sizeClasses[size],
      src ? '' : `${color} text-white font-semibold`
    ]"
  >
    <img v-if="src" :src="src" :alt="alt" class="w-full h-full object-cover" />
    <span v-else-if="initials">{{ initials }}</span>
    <svg v-else class="w-full h-full p-1" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  </div>
</template>
