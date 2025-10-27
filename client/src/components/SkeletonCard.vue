<script setup lang="ts">
interface Props {
  variant?: 'task' | 'board' | 'default'
  height?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  height: '120px'
})
</script>

<template>
  <div 
    class="skeleton-card"
    :class="[
      'card-glass-strong-rounded-2xl',
      variant === 'task' ? 'p-4' : 'p-6'
    ]"
    :style="{ minHeight: height }"
  >
    <!-- Task variant -->
    <template v-if="variant === 'task'">
      <div class="skeleton-line skeleton-title mb-3"></div>
      <div class="skeleton-line skeleton-text mb-2"></div>
      <div class="skeleton-line skeleton-text-short"></div>
    </template>

    <!-- Board variant -->
    <template v-else-if="variant === 'board'">
      <div class="skeleton-line skeleton-title mb-4"></div>
      <div class="skeleton-line skeleton-text mb-2"></div>
      <div class="skeleton-line skeleton-text mb-2"></div>
      <div class="skeleton-line skeleton-text-short mb-4"></div>
      <div class="flex gap-2 mt-auto">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </template>

    <!-- Default variant -->
    <template v-else>
      <div class="skeleton-line skeleton-title mb-3"></div>
      <div class="skeleton-line skeleton-text mb-2"></div>
      <div class="skeleton-line skeleton-text mb-2"></div>
      <div class="skeleton-line skeleton-text-short"></div>
    </template>
  </div>
</template>

<style scoped>
.skeleton-card {
  @apply relative overflow-hidden;
  animation: skeleton-fade 1.5s ease-in-out infinite;
}

.skeleton-line {
  @apply relative rounded-md bg-gray-300 dark:bg-gray-700 overflow-hidden;
  height: 16px;
}

.skeleton-title {
  height: 24px;
  width: 70%;
}

.skeleton-text {
  width: 100%;
}

.skeleton-text-short {
  width: 60%;
}

.skeleton-button {
  @apply relative rounded-lg bg-gray-300 dark:bg-gray-700 overflow-hidden;
  height: 36px;
  width: 80px;
}

/* Shimmer effect */
.skeleton-line::before,
.skeleton-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: skeleton-shimmer 2s infinite;
}

.dark .skeleton-line::before,
.dark .skeleton-button::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
}

@keyframes skeleton-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes skeleton-fade {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

