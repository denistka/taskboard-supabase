<script setup lang="ts">
import { useToast, type Toast } from '../composables/useToast'
import { IconClose } from './icons'

const { toasts, remove } = useToast()

const getToastColor = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/90 border-green-400/50 text-white'
    case 'error':
      return 'bg-red-500/90 border-red-400/50 text-white'
    case 'warning':
      return 'bg-yellow-500/90 border-yellow-400/50 text-white'
    case 'info':
      return 'bg-blue-500/90 border-blue-400/50 text-white'
    default:
      return 'bg-gray-500/90 border-gray-400/50 text-white'
  }
}

const getIconPath = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' // check circle
    case 'error':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' // x circle
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' // exclamation triangle
    case 'info':
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' // info circle
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
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
          'flex items-center gap-3 min-w-[280px] max-w-md p-4 rounded-lg',
          'backdrop-blur-xl border shadow-2xl',
          'pointer-events-auto cursor-pointer',
          'transition-all duration-300 hover:scale-105',
          getToastColor(toast.type)
        ]"
        @click="remove(toast.id)"
        role="alert"
        :aria-label="`${toast.type} notification`"
      >
        <!-- Icon -->
        <div class="flex-shrink-0">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="getIconPath(toast.type)"
            />
          </svg>
        </div>

        <!-- Message -->
        <div class="flex-1 font-medium text-sm">
          {{ toast.message }}
        </div>

        <!-- Close button -->
        <button
          @click.stop="remove(toast.id)"
          class="flex-shrink-0 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
          :aria-label="`Close ${toast.type} notification`"
        >
          <IconClose :size="20" :stroke-width="2.5" />
        </button>
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

