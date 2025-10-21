<template>
  <div :class="cardClasses" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Define the component props with TypeScript interfaces
interface GlassCardProps {
  variant?: 'neon' | 'shimmer' | 'basic'
  color?: 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
  size?: 'sm' | 'md' | 'lg'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'sm' | 'md' | 'lg' | 'xl'
}

// Set up props with defaults
const props = withDefaults(defineProps<GlassCardProps>(), {
  variant: 'basic',
  color: 'purple',
  size: 'md',
  padding: 'md',
  rounded: 'lg'
})

// Size configuration
const sizeConfig = {
  sm: { minHeight: 'min-h-32' },
  md: { minHeight: 'min-h-48' },
  lg: { minHeight: 'min-h-64' }
}

// Padding configuration
const paddingConfig = {
  none: { padding: '' },
  sm: { padding: 'p-4' },
  md: { padding: 'p-6' },
  lg: { padding: 'p-8' }
}

// Rounded configuration
const roundedConfig = {
  sm: { rounded: 'rounded-lg' },
  md: { rounded: 'rounded-xl' },
  lg: { rounded: 'rounded-2xl' },
  xl: { rounded: 'rounded-3xl' }
}

// Computed classes
const cardClasses = computed(() => {
  const baseClasses = [
    'glass-card',
    `glass-card-${props.variant}`,
    `glass-card-${props.color}`,
    sizeConfig[props.size].minHeight,
    paddingConfig[props.padding].padding,
    roundedConfig[props.rounded].rounded,
    'backdrop-blur-lg',
    'border',
    'transition-all',
    'duration-300',
    'relative',
    'overflow-hidden'
  ]
  
  return baseClasses.join(' ')
})
</script>

<style scoped>
/* Base Glass Card Styles */
.glass-card {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Basic Variant */
.glass-card-basic {
  background: rgba(255, 255, 255, 0.1);
}

/* Neon Variant */
.glass-card-neon {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.1) 0%, 
    rgba(var(--glass-secondary), 0.15) 50%, 
    rgba(var(--glass-tertiary), 0.15) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.3);
  box-shadow: 
    0 0 20px rgba(var(--glass-accent), 0.2),
    0 0 40px rgba(var(--glass-accent), 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Shimmer Variant */
.glass-card-shimmer {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.1) 0%, 
    rgba(var(--glass-secondary), 0.15) 50%, 
    rgba(var(--glass-tertiary), 0.15) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.3);
  box-shadow: 
    0 0 20px rgba(var(--glass-accent), 0.2),
    0 0 40px rgba(var(--glass-accent), 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-card-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--glass-accent), 0.1) 50%,
    transparent 100%
  );
  animation: shimmer 3s infinite;
  pointer-events: none;
}

/* Shimmer Animation */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Hover Effects */
.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.glass-card-neon:hover {
  box-shadow: 
    0 0 30px rgba(var(--glass-accent), 0.3),
    0 0 60px rgba(var(--glass-accent), 0.15),
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.glass-card-shimmer:hover {
  box-shadow: 
    0 0 30px rgba(var(--glass-accent), 0.3),
    0 0 60px rgba(var(--glass-accent), 0.15),
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
</style>
