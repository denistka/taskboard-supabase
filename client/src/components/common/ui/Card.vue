<script setup lang="ts">
interface Props {
  variant?: 'subtle' | 'strong'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'strong',
  padding: 'md',
  hover: false
})
</script>

<template>
  <div 
    :class="[
      variant === 'subtle' ? 'card-glass-subtle-rounded' : 'card-glass-strong-rounded-2xl',
      {
        'p-4': padding === 'sm',
        'p-6': padding === 'md',
        'p-8': padding === 'lg',
        'hover-lift-scale transition-all duration-300': hover
      }
    ]"
  >
    <slot />
  </div>
</template>
