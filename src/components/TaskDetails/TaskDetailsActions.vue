<script setup lang="ts">
import type { UserPresence } from '@/types'
import { TrashIcon } from '@/components/icons'

interface Props {
  usersEditingThisTask: UserPresence[]
}

defineProps<Props>()

const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
    <button
      @click="() => { if (usersEditingThisTask.length === 0) emit('delete') }"
      :disabled="usersEditingThisTask.length > 0"
      class="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
      :class="{ 'opacity-50 cursor-not-allowed': usersEditingThisTask.length > 0 }"
    >
      <TrashIcon class="w-5 h-5" />
      Delete Task
    </button>
  </div>
</template>
