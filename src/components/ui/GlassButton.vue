<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <span class="relative z-10">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Define the component props with TypeScript interfaces
interface GlassButtonProps {
  variant?: 'neon' | 'shimmer' | 'basic'
  color?: 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  layout?: 'inline' | 'stacked'
}

// Define emits
interface GlassButtonEmits {
  (e: 'click', event: MouseEvent): void
}

// Set up props with defaults
const props = withDefaults(defineProps<GlassButtonProps>(), {
  variant: 'neon',
  color: 'purple',
  size: 'xs',
  disabled: false,
  layout: 'inline'
})

// Define emits
const emit = defineEmits<GlassButtonEmits>()

// Color palette configuration
const colorPalette = {
  purple: { primary: [147, 51, 234], secondary: [124, 58, 237], tertiary: [109, 40, 217], accent: [168, 85, 247] },
  blue: { primary: [37, 99, 235], secondary: [29, 78, 216], tertiary: [30, 64, 175], accent: [59, 130, 246] },
  cyan: { primary: [8, 145, 178], secondary: [14, 116, 144], tertiary: [21, 94, 117], accent: [6, 182, 212] },
  green: { primary: [22, 163, 74], secondary: [21, 128, 61], tertiary: [20, 83, 45], accent: [34, 197, 94] },
  yellow: { primary: [202, 138, 4], secondary: [161, 98, 7], tertiary: [133, 77, 14], accent: [234, 179, 8] },
  orange: { primary: [234, 88, 12], secondary: [194, 65, 12], tertiary: [154, 52, 18], accent: [249, 115, 22] },
  red: { primary: [220, 38, 38], secondary: [185, 28, 28], tertiary: [153, 27, 27], accent: [239, 68, 68] },
  pink: { primary: [219, 39, 119], secondary: [190, 24, 93], tertiary: [157, 23, 77], accent: [236, 72, 153] },
  magenta: { primary: [192, 38, 211], secondary: [162, 28, 175], tertiary: [134, 25, 143], accent: [217, 70, 239] },
  lime: { primary: [132, 204, 22], secondary: [101, 163, 13], tertiary: [77, 124, 15], accent: [163, 230, 53] }
}

// Size configuration
const sizeConfig = {
  xs: { padding: 'px-3 py-1.5', text: 'text-xs', radius: 'rounded-xl' },
  sm: { padding: 'px-5 py-1.5', text: 'text-sm', radius: 'rounded-[0.9rem]' },
  md: { padding: 'px-5 py-2', text: 'text-base', radius: 'rounded-[1.1rem]' },
  lg: { padding: 'px-6 py-2', text: 'text-lg', radius: 'rounded-[1.25rem]' }
}

// Computed classes
const buttonClasses = computed(() => {
  const baseClasses = [
    'glass-button',
    `glass-${props.variant}`,
    `glass-${props.color}`,
    `glass-${props.size}`,
    `glass-${props.layout}`,
    sizeConfig[props.size].padding,
    sizeConfig[props.size].text,
    sizeConfig[props.size].radius,
    'font-semibold',
    'transition-all',
    'duration-300',
    'hover:scale-105',
    'relative',
    'overflow-hidden',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:hover:scale-100',
    'group' // Add group class for child hover effects
  ]
  
  return baseClasses.join(' ')
})

// Set CSS custom properties based on color
const setColorVariables = () => {
  const colors = colorPalette[props.color]
  const root = document.documentElement
  
  root.style.setProperty('--glass-primary', colors.primary.join(', '))
  root.style.setProperty('--glass-secondary', colors.secondary.join(', '))
  root.style.setProperty('--glass-tertiary', colors.tertiary.join(', '))
  root.style.setProperty('--glass-accent', colors.accent.join(', '))
}

// Watch for color changes and update CSS variables
import { watch, onMounted } from 'vue'
watch(() => props.color, setColorVariables, { immediate: true })
onMounted(setColorVariables)
</script>

<style scoped>
/* Base Glass Button Styles */
.glass-button {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.8);
}

/* Layout Styles */
.glass-inline {
  @apply inline-flex items-center justify-center;
}

.glass-stacked {
  @apply flex flex-col items-center justify-center;
}

/* Dark theme text color */
.dark .glass-button {
  color: white;
}

/* Base pseudo-elements */
.glass-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: inherit;
  pointer-events: none;
}

.glass-button::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  height: 5%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.207) 0%,
    rgba(255, 255, 255, 0.057) 50%,
    transparent 100%
  );
  border-radius: inherit;
  pointer-events: none;
}

.glass-button:hover {
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Neon Variant - Light Theme (Default) */
.glass-neon {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.15) 0%, 
    rgba(var(--glass-secondary), 0.2) 50%, 
    rgba(var(--glass-tertiary), 0.2) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.4);
  box-shadow: 
    0 0 15px rgba(var(--glass-accent), 0.3),
    0 0 30px rgba(var(--glass-accent), 0.15),
    0 4px 16px rgba(var(--glass-primary), 0.2),
    0 8px 32px rgba(var(--glass-secondary), 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Dark Theme Neon Override */
.dark .glass-neon {
  box-shadow: 
    0 0 15px rgba(var(--glass-accent), 0.3),
    0 0 30px rgba(var(--glass-accent), 0.15),
    0 4px 16px rgba(var(--glass-primary), 0.2),
    0 8px 32px rgba(var(--glass-secondary), 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Shimmer Variant */
.glass-shimmer {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.15) 0%, 
    rgba(var(--glass-secondary), 0.2) 50%, 
    rgba(var(--glass-tertiary), 0.2) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.4);
  box-shadow: 
    0 0 15px rgba(var(--glass-accent), 0.3),
    0 0 30px rgba(var(--glass-accent), 0.15),
    0 4px 16px rgba(var(--glass-primary), 0.2),
    0 8px 32px rgba(var(--glass-secondary), 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-shimmer::before {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--glass-accent), 0.25) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

/* Basic Variant */
.glass-basic {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 16px rgba(var(--glass-primary), 0.15),
    0 8px 32px rgba(var(--glass-secondary), 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Shimmer Animation */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
