<template>
  <div class="glass-input-container">
    <label v-if="label" :for="inputId" class="glass-input-label">
      {{ label }}
    </label>
    <div class="glass-input-wrapper">
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :class="inputClasses"
        v-bind="$attrs"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
      <div v-if="icon" class="glass-input-icon">
        <slot name="icon">
          <component :is="icon" class="w-5 h-5" />
        </slot>
      </div>
    </div>
    <div v-if="error" class="glass-input-error">
      {{ error }}
    </div>
    <div v-if="hint" class="glass-input-hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

// Define the component props with TypeScript interfaces
interface GlassInputProps {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  variant?: 'neon' | 'shimmer' | 'basic'
  color?: 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
  size?: 'sm' | 'md' | 'lg'
  icon?: any
}

// Define emits
interface GlassInputEmits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}

// Set up props with defaults
const props = withDefaults(defineProps<GlassInputProps>(), {
  type: 'text',
  variant: 'basic',
  color: 'purple',
  size: 'md',
  disabled: false
})

// Define emits
const emit = defineEmits<GlassInputEmits>()

// Generate unique ID for accessibility
const inputId = useId()

// Size configuration
const sizeConfig = {
  sm: { 
    padding: 'px-3 py-2', 
    text: 'text-sm',
    iconSize: 'w-4 h-4'
  },
  md: { 
    padding: 'px-4 py-3', 
    text: 'text-base',
    iconSize: 'w-5 h-5'
  },
  lg: { 
    padding: 'px-5 py-4', 
    text: 'text-lg',
    iconSize: 'w-6 h-6'
  }
}

// Computed classes
const inputClasses = computed(() => {
  const baseClasses = [
    'glass-input',
    `glass-input-${props.variant}`,
    `glass-input-${props.color}`,
    `glass-input-${props.size}`,
    sizeConfig[props.size].padding,
    sizeConfig[props.size].text,
    'w-full',
    'rounded-xl',
    'border',
    'transition-all',
    'duration-300',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-opacity-50',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'placeholder:text-white/50',
    'text-white',
    'bg-transparent'
  ]
  
  if (props.error) {
    baseClasses.push('border-red-400', 'focus:ring-red-400')
  } else {
    baseClasses.push('border-white/20', 'focus:ring-white/30')
  }
  
  if (props.icon) {
    baseClasses.push('pr-12')
  }
  
  return baseClasses.join(' ')
})
</script>

<style scoped>
/* Base Glass Input Styles */
.glass-input {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 0 0 2px rgba(255, 255, 255, 0.1),
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Neon Variant */
.glass-input-neon {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.05) 0%, 
    rgba(var(--glass-secondary), 0.1) 50%, 
    rgba(var(--glass-tertiary), 0.1) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.3);
  box-shadow: 
    0 0 10px rgba(var(--glass-accent), 0.2),
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-input-neon:focus {
  border-color: rgba(var(--glass-accent), 0.5);
  box-shadow: 
    0 0 0 2px rgba(var(--glass-accent), 0.2),
    0 0 20px rgba(var(--glass-accent), 0.3),
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Shimmer Variant */
.glass-input-shimmer {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.05) 0%, 
    rgba(var(--glass-secondary), 0.1) 50%, 
    rgba(var(--glass-tertiary), 0.1) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.3);
  box-shadow: 
    0 0 10px rgba(var(--glass-accent), 0.2),
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.glass-input-shimmer::before {
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
  animation: shimmer 2s infinite;
  pointer-events: none;
}

.glass-input-shimmer:focus {
  border-color: rgba(var(--glass-accent), 0.5);
  box-shadow: 
    0 0 0 2px rgba(var(--glass-accent), 0.2),
    0 0 20px rgba(var(--glass-accent), 0.3),
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Container and wrapper styles */
.glass-input-container {
  @apply w-full;
}

.glass-input-wrapper {
  @apply relative;
}

.glass-input-icon {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none;
}

.glass-input-label {
  @apply block text-sm font-medium text-white/90 mb-2;
}

.glass-input-error {
  @apply mt-2 text-sm text-red-400;
}

.glass-input-hint {
  @apply mt-2 text-sm text-white/60;
}

/* Shimmer Animation */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
