<script setup lang="ts">
import { ref, watch } from 'vue'
import { uiButton, uiInput } from '../../common/ui'
import { IconClose, IconPlus } from '../../common/icons'

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
        class="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
        @click="handleClose"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="slide-down">
      <div 
        v-if="modelValue"
        class="modal-glass fixed top-16 right-4 shadow-2xl z-50 rounded-lg overflow-hidden min-w-[400px] max-w-[500px]"
        style="backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);"
      >
        <!-- Header -->
        <div class="p-4 border-b border-white/20 dark:border-gray-700/40 flex items-center justify-between gap-3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Board</h2>
          
          <div class="flex items-center gap-3">

            <ui-button
                @click="handleCreate"
                color="purple"
                size="xs"
                variant="shimmer"
                :disabled="!boardName.trim()"
                title="Create Board"
                aria-label="Create board"
            >
              <IconPlus :size="16" />
            </ui-button>

          </div>
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
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Glass effect modal */
.modal-glass {
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dark .modal-glass {
  background-color: rgba(17, 24, 39, 0.2) !important;
  border-color: rgba(55, 65, 81, 0.2) !important;
}

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
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-500px);
}
</style>

