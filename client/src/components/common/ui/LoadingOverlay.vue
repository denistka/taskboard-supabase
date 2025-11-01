<template>
  <Teleport to="body">
    <Transition name="loading-overlay">
      <div
        v-if="internalVisible"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div
          class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-8 py-8 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[10px] dark:border-white/10 dark:bg-gray-900/80"
        >
          <div
            class="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-500 dark:border-gray-700/30 dark:border-t-blue-400"
          ></div>
          <p
            v-if="message"
            class="m-0 text-center text-sm font-medium text-white dark:text-white/90"
          >
            {{ message }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  message?: string
  hideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  hideDelay: 300
})

const internalVisible = ref(props.visible)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.visible, (newValue) => {
  if (newValue) {
    // Show immediately
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    internalVisible.value = true
  } else {
    // Delay hiding
    hideTimeout = setTimeout(() => {
      internalVisible.value = false
      hideTimeout = null
    }, props.hideDelay)
  }
}, { immediate: true })

onUnmounted(() => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
})
</script>

<style scoped>
/* Transition animations */
.loading-overlay-enter-active,
.loading-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.loading-overlay-enter-active > div,
.loading-overlay-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.loading-overlay-enter-from,
.loading-overlay-leave-to {
  opacity: 0;
}

.loading-overlay-enter-from > div,
.loading-overlay-leave-to > div {
  transform: scale(0.9);
  opacity: 0;
}
</style>

