<script setup lang="ts">
import { ref } from 'vue'
import { uiButton, uiInput, uiCard } from './ui'
import { IconPlus, IconClose } from './icons'

interface Emits {
  (e: 'create', name: string, description: string): void
}

const emit = defineEmits<Emits>()

const isCreating = ref(false)
const boardName = ref('')
const boardDescription = ref('')

const handleCreate = () => {
  if (boardName.value.trim()) {
    emit('create', boardName.value, boardDescription.value)
    resetForm()
  }
}

const resetForm = () => {
  boardName.value = ''
  boardDescription.value = ''
  isCreating.value = false
}

const toggleCreating = () => {
  isCreating.value = !isCreating.value
  if (!isCreating.value) {
    resetForm()
  }
}
</script>

<template>
  <!-- Collapsed State: Just a button -->
  <ui-card 
    v-if="!isCreating"
    variant="strong" 
    padding="md" 
    :hover="true" 
    class="shadow-lg flex flex-col h-full items-center justify-center min-h-[180px] cursor-pointer border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
    @click="toggleCreating"
  >
    <div class="flex flex-col items-center gap-3">
      <div class="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
        <IconPlus :size="32" class="text-purple-500" />
      </div>
      <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Create New Board</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Click to add a new board</p>
    </div>
  </ui-card>

  <!-- Expanded State: Form -->
  <ui-card 
    v-else
    variant="strong" 
    padding="md" 
    class="shadow-lg flex flex-col h-full animate-slide-in"
  >
    <div class="flex-1 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-100">New Board</h3>
        <ui-button
          @click="toggleCreating"
          color="red"
          size="xs"
          variant="neon"
          title="Cancel"
          aria-label="Cancel board creation"
        >
          <IconClose :size="16" />
        </ui-button>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-2">Board Name</label>
        <ui-input 
          v-model="boardName" 
          type="text"
          placeholder="Enter board name..." 
          :required="true"
          @keyup.enter="handleCreate"
        />
      </div>
      
      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-2">Description</label>
        <ui-input 
          v-model="boardDescription" 
          :rows="3" 
          placeholder="Enter description (optional)..." 
        />
      </div>
    </div>

    <div class="flex gap-2 mt-6">
      <ui-button 
        @click="handleCreate"
        color="purple" 
        size="md" 
        variant="shimmer"
        :disabled="!boardName.trim()"
        class="flex-1"
      >
        Create Board
      </ui-button>
      <ui-button 
        @click="resetForm"
        color="blue" 
        size="md" 
        variant="basic"
      >
        Cancel
      </ui-button>
    </div>
  </ui-card>
</template>

