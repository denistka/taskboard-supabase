<script setup lang="ts">
import { ref, watch } from 'vue'
import { uiButton, uiInput } from './ui'
import { IconClose } from './icons'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'create', name: string, description: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const boardName = ref('')
const boardDescription = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

const handleCreate = () => {
  if (boardName.value.trim()) {
    emit('create', boardName.value, boardDescription.value)
    resetForm()
    emit('update:modelValue', false)
  }
}

const resetForm = () => {
  boardName.value = ''
  boardDescription.value = ''
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div>
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        @click="handleClose"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="slide-down">
      <div 
        v-if="modelValue"
        class="fixed top-16 right-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl z-50 rounded-lg overflow-hidden min-w-[400px] max-w-[500px]"
      >
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Board</h2>
          <ui-button
            @click="handleClose"
            color="blue"
            size="xs"
            variant="neon"
            aria-label="Close"
          >
            <IconClose :size="16" />
          </ui-button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Board Name
            </label>
            <ui-input 
              v-model="boardName" 
              type="text"
              placeholder="Enter board name..." 
              :required="true"
              @keyup.enter="handleCreate"
              autofocus
            />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <ui-input 
              v-model="boardDescription" 
              :rows="3" 
              placeholder="Enter description (optional)..." 
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="p-6 pt-0 flex gap-2">
          <ui-button 
            @click="handleClose"
            color="blue" 
            size="md" 
            variant="neon"
          >
            Cancel
          </ui-button>
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
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Fade animation for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide down animation for modal */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100px);
}
</style>

