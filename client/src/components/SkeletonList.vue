<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

interface Props {
  variant?: 'board' | 'list'
  columns?: number
  itemsPerColumn?: number
}

withDefaults(defineProps<Props>(), {
  variant: 'board',
  columns: 3,
  itemsPerColumn: 3
})
</script>

<template>
  <!-- 3-column board skeleton (for BoardView) -->
  <div v-if="variant === 'board'" class="flex gap-6 overflow-x-auto pb-6">
    <div 
      v-for="col in columns" 
      :key="col"
      class="flex-shrink-0 w-80"
    >
      <!-- Column header skeleton -->
      <div class="mb-4">
        <div class="skeleton-column-header card-glass-subtle-rounded p-4">
          <div class="skeleton-line skeleton-title mb-2"></div>
          <div class="skeleton-line skeleton-text-short"></div>
        </div>
      </div>
      
      <!-- Task cards skeleton -->
      <div class="space-y-3">
        <SkeletonCard 
          v-for="item in itemsPerColumn" 
          :key="item"
          variant="task"
          height="100px"
        />
      </div>
    </div>
  </div>

  <!-- Grid list skeleton (for BoardsListView) -->
  <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <SkeletonCard 
      v-for="item in (columns * itemsPerColumn)" 
      :key="item"
      variant="board"
      height="180px"
    />
  </div>
</template>

<style scoped>
.skeleton-column-header {
  @apply relative overflow-hidden;
}

.skeleton-line {
  @apply relative rounded-md bg-gray-300 dark:bg-gray-700 overflow-hidden;
  height: 16px;
}

.skeleton-title {
  height: 20px;
  width: 60%;
}

.skeleton-text-short {
  width: 40%;
}

/* Shimmer effect for column headers */
.skeleton-line::before {
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

.dark .skeleton-line::before {
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
</style>

