<script setup lang="ts">
import { uiButton } from './ui'
import { IconClose } from './icons'

interface Props {
  modelValue: boolean
  title?: string
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

withDefaults(defineProps<Props>(), {
  width: 'md',
  showCloseButton: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const close = () => emit('update:modelValue', false)
</script>

<template>
  <div>
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        @click="close"
      />
    </Transition>

    <!-- Side Panel -->
    <Transition name="slide">
      <div 
        v-if="modelValue"
        class="fixed inset-y-0 right-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-l border-white/20 dark:border-gray-700/30 shadow-2xl z-50 overflow-y-auto"
        :class="{
          'w-full md:w-[400px]': width === 'sm',
          'w-full md:w-[500px]': width === 'md',
          'w-full md:w-[600px]': width === 'lg',
          'w-full md:w-[800px]': width === 'xl',
          'w-full': width === 'full'
        }"
      >
        <!-- Header -->
        <div class="panel-header">
          <slot name="header">
            <h2 v-if="title" class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ title }}
            </h2>
          </slot>
          
          <ui-button 
            v-if="showCloseButton"
            @click="close" 
            color="blue" 
            size="xs" 
            variant="basic"
            aria-label="Close panel"
          >
            <IconClose :size="16" />
          </ui-button>
        </div>

        <!-- Content -->
        <div class="panel-content">
          <slot />
        </div>

        <!-- Actions -->
        <div v-if="$slots.actions" class="panel-actions">
          <slot name="actions" :close="close" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Fade animation for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide animation for panel */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Panel sections */
.panel-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}

.panel-content {
  @apply p-6;
  @apply text-gray-700 dark:text-gray-300;
}

.panel-actions {
  @apply p-6 pt-0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>

