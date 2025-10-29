<template>
  <div 
    class="card-glass-strong-rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 group hover-lift-scale border-l-4 m-1 relative overflow-hidden shadow-md"
    :class="statusColorClass"
    draggable="true"
    @click="$emit('click')"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
  >
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
      {{ task.title }}
    </h3>
    <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
      {{ task.description }}
    </p>
    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
      <div v-if="task.profiles" class="flex items-center gap-2">
        <ui-avatar
          :src="task.profiles.avatar_url || undefined"
          :initials="(task.profiles.full_name?.[0] || task.profiles.email?.[0] || '?').toUpperCase()"
          size="xs"
          color="bg-primary-500"
        />
        <span class="truncate max-w-[120px]">{{ task.profiles.full_name || task.profiles.email }}</span>
      </div>
      <span>{{ formatDate(task.created_at) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../../../../shared/types'
import { uiAvatar } from './ui'

const props = defineProps<{
  task: Task
}>()

defineEmits<{
  click: []
  dragstart: [event: DragEvent]
  dragend: [event: DragEvent]
}>()

const statusColorClass = computed(() => {
  switch (props.task.status) {
    case 'todo':
      return 'border-l-red-500 dark:border-l-red-500/40'
    case 'in_progress':
      return 'border-l-yellow-500 dark:border-l-yellow-500/40'
    case 'done':
      return 'border-l-green-500 dark:border-l-green-500/40'
    default:
      return 'border-l-gray-500'
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
