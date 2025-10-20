<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task } from '@/types'

interface Props {
  tasks: Task[]
  onTaskSelect: (task: Task) => void
}

const props = defineProps<Props>()

const searchQuery = ref('')
const isOpen = ref(false)
const selectedIndex = ref(-1)

const filteredTasks = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase()
  return props.tasks.filter(task => 
    task.title.toLowerCase().includes(query) ||
    (task.description && task.description.toLowerCase().includes(query))
  )
})

const hasResults = computed(() => filteredTasks.value.length > 0)

const selectTask = (task: Task) => {
  props.onTaskSelect(task)
  searchQuery.value = ''
  isOpen.value = false
  selectedIndex.value = -1
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredTasks.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && filteredTasks.value[selectedIndex.value]) {
        selectTask(filteredTasks.value[selectedIndex.value])
      }
      break
    case 'Escape':
      isOpen.value = false
      selectedIndex.value = -1
      break
  }
}

const handleBlur = () => {
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

watch(searchQuery, () => {
  isOpen.value = searchQuery.value.trim().length > 0
  selectedIndex.value = -1
})

const getStatusColor = (status: string) => {
  const colors = {
    todo: 'text-red-600 dark:text-red-400',
    in_progress: 'text-yellow-600 dark:text-yellow-400',
    done: 'text-green-600 dark:text-green-400',
  }
  return colors[status as keyof typeof colors] || 'text-gray-600 dark:text-gray-400'
}

const getStatusIcon = (status: string) => {
  const icons = {
    todo: '📋',
    in_progress: '⚡',
    done: '✅',
  }
  return icons[status as keyof typeof icons] || '📝'
}
</script>

<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tasks..."
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        @keydown="handleKeydown"
        @blur="handleBlur"
        @focus="isOpen = searchQuery.trim().length > 0"
      />
    </div>

    <!-- Search Results Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isOpen && searchQuery.trim()"
        class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none border border-gray-200 dark:border-gray-700"
      >
        <div v-if="!hasResults" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          No tasks found for "{{ searchQuery }}"
        </div>
        
        <button
          v-for="(task, index) in filteredTasks"
          :key="task.id"
          :class="[
            'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
            selectedIndex === index ? 'bg-gray-50 dark:bg-gray-700' : ''
          ]"
          @click="selectTask(task)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm">{{ getStatusIcon(task.status) }}</span>
                <span class="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {{ task.title }}
                </span>
              </div>
              <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                {{ task.description }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="['text-xs font-medium', getStatusColor(task.status)]">
                  {{ task.status.replace('_', ' ') }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-500">
                  {{ new Date(task.created_at).toLocaleDateString() }}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease-out;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
