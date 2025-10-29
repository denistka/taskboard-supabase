<script setup lang="ts">
defineProps<{
  position: 'before' | 'after' | 'empty'
}>()
</script>

<template>
  <div
    v-if="position === 'empty'"
    class="drop-indicator-empty"
  >
    <div class="text-center text-indigo-500 dark:text-indigo-400 font-medium text-sm">
      Drop here
    </div>
  </div>
  <div
    v-else
    class="drop-indicator"
    :class="{
      'mb-3': position === 'before',
      'mt-3': position === 'after'
    }"
  />
</template>

<style scoped>
/* Drop indicator - shows where the card will land */
.drop-indicator {
  height: 4px;
  background: linear-gradient(90deg, 
    transparent 0%,
    var(--drag-indicator-primary) 20%,
    var(--drag-indicator-secondary) 50%,
    var(--drag-indicator-primary) 80%,
    transparent 100%);
  border-radius: 2px;
  box-shadow: 0 0 12px var(--drag-indicator-primary-alpha),
              0 0 24px var(--drag-indicator-secondary-alpha);
  transition: all 0.2s ease;
  animation: indicator-shimmer 1.5s ease-in-out infinite;
  position: relative;
}

.drop-indicator::before {
  content: '';
  position: absolute;
  left: 0;
  top: -4px;
  width: 12px;
  height: 12px;
  background: var(--drag-indicator-primary);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--drag-indicator-primary-alpha);
  animation: indicator-dot-pulse 1s ease-in-out infinite;
}

.drop-indicator::after {
  content: '';
  position: absolute;
  right: 0;
  top: -4px;
  width: 12px;
  height: 12px;
  background: var(--drag-indicator-secondary);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--drag-indicator-secondary-alpha);
  animation: indicator-dot-pulse 1s ease-in-out infinite 0.5s;
}

@keyframes indicator-shimmer {
  0%, 100% {
    opacity: 0.8;
    transform: scaleX(1);
  }
  50% {
    opacity: 1;
    transform: scaleX(1.02);
  }
}

@keyframes indicator-dot-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

/* Drop indicator for empty columns */
.drop-indicator-empty {
  width: 80%;
  padding: 2rem;
  background: linear-gradient(135deg, 
    var(--drop-indicator-bg-start) 0%, 
    var(--drop-indicator-bg-end) 100%);
  border: 3px dashed var(--drop-indicator-border);
  border-radius: 1rem;
  animation: empty-drop-pulse 1s ease-in-out infinite;
  box-shadow: 0 0 30px var(--drop-indicator-shadow);
}

@keyframes empty-drop-pulse {
  0%, 100% {
    transform: scale(1);
    border-color: var(--drop-indicator-border);
  }
  50% {
    transform: scale(1.02);
    border-color: var(--drop-indicator-border-hover);
  }
}
</style>

