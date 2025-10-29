<script setup lang="ts">
import { useToast, type Toast } from '../../composables/useNotification'
import { 
  IconClose, 
  IconCheckCircle, 
  IconXCircle, 
  IconExclamationTriangle, 
  IconInfoCircle 
} from '../common/icons'
import Button from '../common/ui/Button.vue'
import { type Component } from 'vue'

const { toasts, remove } = useToast()

const getToastColor = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/20 dark:bg-green-500/15 border-green-400/40 dark:border-green-400/30 text-green-700 dark:text-green-50 shadow-green-500/20'
    case 'error':
      return 'bg-red-500/20 dark:bg-red-500/15 border-red-400/40 dark:border-red-400/30 text-red-700 dark:text-red-50 shadow-red-500/20'
    case 'warning':
      return 'bg-yellow-500/20 dark:bg-yellow-500/15 border-yellow-400/40 dark:border-yellow-400/30 text-yellow-800 dark:text-yellow-50 shadow-yellow-500/20'
    case 'info':
      return 'bg-blue-500/20 dark:bg-blue-500/15 border-blue-400/40 dark:border-blue-400/30 text-blue-700 dark:text-blue-50 shadow-blue-500/20'
    default:
      return 'bg-gray-500/20 dark:bg-gray-500/15 border-gray-400/40 dark:border-gray-400/30 text-gray-700 dark:text-gray-50 shadow-gray-500/20'
  }
}

const getIconComponent = (type: Toast['type']): Component => {
  switch (type) {
    case 'success':
      return IconCheckCircle
    case 'error':
      return IconXCircle
    case 'warning':
      return IconExclamationTriangle
    case 'info':
      return IconInfoCircle
    default:
      return IconInfoCircle
  }
}
</script>

<template>
  <div 
    class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    aria-live="polite" 
    aria-atomic="true"
  >
    <transition-group 
      name="toast"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex items-center gap-3 min-w-[280px] max-w-md p-4 rounded-xl',
          'backdrop-blur-2xl border shadow-2xl',
          'pointer-events-auto cursor-pointer',
          'transition-all duration-300 hover:scale-105 hover:shadow-xl',
          'bg-white/10 dark:bg-gray-900/30',
          getToastColor(toast.type)
        ]"
        @click="remove(toast.id)"
        role="alert"
        :aria-label="`${toast.type} notification`"
      >
        <!-- Icon -->
        <div class="flex-shrink-0">
          <component 
            :is="getIconComponent(toast.type)" 
            :size="24" 
            :stroke-width="2"
          />
        </div>

        <!-- Message -->
        <div class="flex-1 font-medium text-sm">
          {{ toast.message }}
        </div>

        <!-- Close button -->
        <Button
          variant="neon"
          size="xs"
          layout="inline"
          @click.stop="remove(toast.id)"
          :aria-label="`Close ${toast.type} notification`"
          class="flex-shrink-0 !p-1 !min-w-0"
        >
          <IconClose :size="20" :stroke-width="2.5" />
        </Button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
/* Slide in from right animation */
.toast-enter-active {
  animation: toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  animation: toast-slide-out 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-slide-in {
  from {
    transform: translateX(120%) translateY(0);
    opacity: 0;
  }
  to {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
}

@keyframes toast-slide-out {
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(120%) scale(0.9);
    opacity: 0;
  }
}
</style>

