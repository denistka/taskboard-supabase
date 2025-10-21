<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="glass-modal-overlay"
        @click="handleOverlayClick"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            :class="modalClasses"
            @click.stop
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="glass-modal-header">
              <slot name="header">
                <h3 class="glass-modal-title">{{ title }}</h3>
              </slot>
              <button
                v-if="closable"
                @click="$emit('update:modelValue', false)"
                class="glass-modal-close"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="glass-modal-body">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="glass-modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

// Define the component props with TypeScript interfaces
interface GlassModalProps {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'neon' | 'shimmer' | 'basic'
  color?: 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
  closable?: boolean
  closeOnOverlay?: boolean
}

// Define emits
interface GlassModalEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

// Set up props with defaults
const props = withDefaults(defineProps<GlassModalProps>(), {
  size: 'md',
  variant: 'basic',
  color: 'purple',
  closable: true,
  closeOnOverlay: true
})

// Define emits
const emit = defineEmits<GlassModalEmits>()

// Size configuration
const sizeConfig = {
  sm: { width: 'max-w-md' },
  md: { width: 'max-w-lg' },
  lg: { width: 'max-w-2xl' },
  xl: { width: 'max-w-4xl' },
  full: { width: 'max-w-full mx-4' }
}

// Computed classes
const modalClasses = computed(() => {
  const baseClasses = [
    'glass-modal',
    `glass-modal-${props.variant}`,
    `glass-modal-${props.color}`,
    sizeConfig[props.size].width,
    'w-full',
    'mx-auto',
    'my-8',
    'rounded-2xl',
    'backdrop-blur-xl',
    'border',
    'shadow-2xl',
    'relative',
    'overflow-hidden'
  ]
  
  return baseClasses.join(' ')
})

// Handle overlay click
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('update:modelValue', false)
    emit('close')
  }
}

// Handle escape key
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) {
    emit('update:modelValue', false)
    emit('close')
  }
}

// Watch for modelValue changes to handle body scroll
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleEscape)
  }
})
</script>

<style scoped>
/* Modal Overlay */
.glass-modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Base Modal Styles */
.glass-modal {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
}

/* Basic Variant */
.glass-modal-basic {
  background: rgba(255, 255, 255, 0.1);
}

/* Neon Variant */
.glass-modal-neon {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.1) 0%, 
    rgba(var(--glass-secondary), 0.15) 50%, 
    rgba(var(--glass-tertiary), 0.15) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.3);
  box-shadow: 
    0 0 30px rgba(var(--glass-accent), 0.2),
    0 0 60px rgba(var(--glass-accent), 0.1),
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Shimmer Variant */
.glass-modal-shimmer {
  background: linear-gradient(121deg, 
    rgba(var(--glass-primary), 0.1) 0%, 
    rgba(var(--glass-secondary), 0.15) 50%, 
    rgba(var(--glass-tertiary), 0.15) 100%);
  border: 1px solid rgba(var(--glass-accent), 0.3);
  box-shadow: 
    0 0 30px rgba(var(--glass-accent), 0.2),
    0 0 60px rgba(var(--glass-accent), 0.1),
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-modal-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--glass-accent), 0.05) 50%,
    transparent 100%
  );
  animation: shimmer 4s infinite;
  pointer-events: none;
}

/* Modal Header */
.glass-modal-header {
  @apply flex items-center justify-between p-6 border-b border-white/10;
}

.glass-modal-title {
  @apply text-xl font-semibold text-white;
}

.glass-modal-close {
  @apply p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-200;
}

/* Modal Body */
.glass-modal-body {
  @apply flex-1 p-6 overflow-y-auto;
}

/* Modal Footer */
.glass-modal-footer {
  @apply flex items-center justify-end gap-3 p-6 border-t border-white/10;
}

/* Shimmer Animation */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
