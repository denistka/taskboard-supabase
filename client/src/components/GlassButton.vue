<template>
  <button
    :class="buttonClasses"
    :style="buttonStyles"
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

interface GlassButtonProps {
  variant?: 'neon' | 'shimmer' | 'basic'
  color?: 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  layout?: 'inline' | 'stacked'
}

interface GlassButtonEmits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<GlassButtonProps>(), {
  variant: 'neon',
  color: 'blue',
  size: 'xs',
  disabled: false,
  layout: 'inline'
})

const emit = defineEmits<GlassButtonEmits>()

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

const sizeConfig = {
  xs: { padding: 'px-2 py-1', text: 'text-xs', radius: 'rounded-lg' },
  sm: { padding: 'px-5 py-1.5', text: 'text-sm', radius: 'rounded-[0.9rem]' },
  md: { padding: 'px-5 py-2', text: 'text-base', radius: 'rounded-[1.1rem]' },
  lg: { padding: 'px-6 py-2', text: 'text-lg', radius: 'rounded-[1.25rem]' }
}

const buttonClasses = computed(() => {
  const baseClasses = [
    'glass-button',
    `glass-${props.variant}`,
    `glass-${props.size}`,
    `glass-${props.layout}`,
    sizeConfig[props.size].padding,
    sizeConfig[props.size].text,
    sizeConfig[props.size].radius,
    'font-semibold',
    'transition-all',
    'duration-300',
    'relative',
    'overflow-hidden',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'group'
  ]
  
  return baseClasses.join(' ')
})

const buttonStyles = computed(() => {
  const colors = colorPalette[props.color]
  return {
    '--glass-primary': colors.primary.join(', '),
    '--glass-secondary': colors.secondary.join(', '),
    '--glass-tertiary': colors.tertiary.join(', '),
    '--glass-accent': colors.accent.join(', ')
  }
})
</script>

<style scoped>
.glass-button {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: rgba(0, 0, 0, 0.8);
}

.glass-button:hover:not(:disabled) {
  transform: scale(1.02);
}

.glass-button:disabled {
  transform: scale(1);
}

.glass-inline {
  @apply inline-flex items-center justify-center;
}

.glass-stacked {
  @apply flex flex-col items-center justify-center;
}

.dark .glass-button {
  color: white;
}

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

.glass-button:hover:not(:disabled) {
  background: rgba(var(--glass-primary), 0.15);
  box-shadow: 
    0 0 12px rgba(var(--glass-accent), 0.2),
    0 0 24px rgba(var(--glass-accent), 0.1),
    0 6px 20px rgb(0 0 0 / 18%),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.glass-neon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-neon::before {
  display: none;
}

.glass-shimmer {
  background: rgba(var(--glass-primary), 0.12);
  border: 1px solid rgba(var(--glass-accent), 0.3);
  box-shadow: 
    0 0 8px rgba(var(--glass-accent), 0.15),
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.05),
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

.glass-basic {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.glass-basic:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
