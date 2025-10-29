<script setup lang="ts">
import { ref, computed, watchEffect, nextTick } from 'vue'
import { uiButton } from '../../common/ui'
import { TaskComments } from '.'
import type { Task, TaskStatus } from '../../../../../shared/types'

interface Props {
  task: Task | null
  isOpen?: boolean
  currentStatus?: TaskStatus // Current status from parent (for immediate UI updates)
}

interface Emits {
  (e: 'update:title', value: string): void
  (e: 'update:description', value: string): void
  (e: 'update:status', value: TaskStatus): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs for contenteditable elements
const titleRef = ref<HTMLElement | null>(null)
const descriptionRef = ref<HTMLElement | null>(null)

// Sync contenteditable content with task prop and modal open state
watchEffect(async () => {
  // Watch task values and isOpen state to trigger updates
  const taskId = props.task?.id
  const taskTitle = props.task?.title
  const taskDescription = props.task?.description
  const isOpen = props.isOpen
  
  if (taskId && isOpen && titleRef.value && descriptionRef.value) {
    await nextTick()
    // Only update if content is different to avoid cursor jumping
    const titleText = taskTitle || ''
    const descText = taskDescription || ''
    
    if (titleRef.value.textContent !== titleText) {
      titleRef.value.textContent = titleText
    }
    if (descriptionRef.value.textContent !== descText) {
      descriptionRef.value.textContent = descText
    }
  }
})

// Use currentStatus prop for immediate UI updates, fallback to task.status
// This ensures the UI updates immediately when status button is clicked
const currentTaskStatus = computed(() => {
  // Priority: currentStatus prop (from parent's local state) > task.status (from saved data)
  // Always prefer currentStatus prop when it exists (even if it matches task.status)
  return props.currentStatus ?? props.task?.status ?? 'todo'
})

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'red' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'done', label: 'Done', color: 'green' }
]

const handleStatusClick = (status: TaskStatus) => {
  emit('update:status', status)
}

const handleTitleInput = (e: Event) => {
  const text = (e.target as HTMLElement).textContent || ''
  emit('update:title', text)
}

const handleDescriptionInput = (e: Event) => {
  const text = (e.target as HTMLElement).textContent || ''
  emit('update:description', text)
}

// Prevent paste of formatted text, keep only plain text
const handleTitlePaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  if (titleRef.value) {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(text)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    handleTitleInput(e as any)
  }
}

const handleDescriptionPaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  if (descriptionRef.value) {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(text)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    handleDescriptionInput(e as any)
  }
}

const handleSubmit = (e: Event) => {
  e.preventDefault()
  emit('submit')
}
</script>

<template>
  <div class="panel-content">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Status Selector -->
      <div>
        <label class="label-text-themed-semibold mb-3 block">Status</label>
        <div class="flex gap-2">
          <ui-button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            :color="option.color as any"
            :disabled="option.value === currentTaskStatus"
            variant='neon'
            size="sm"
            @click="handleStatusClick(option.value)"
          >
            {{ option.label }}
          </ui-button>
        </div>
      </div>

      <!-- Title and Description -->
      <div>
        <label class="label-text-themed-semibold">Title</label>
        <div
          ref="titleRef"
          contenteditable="true"
          class="contenteditable-input"
          role="textbox"
          data-placeholder="Enter task title..."
          @input="handleTitleInput"
          @paste="handleTitlePaste"
          @blur="handleTitleInput"
        />
      </div>

      <div>
        <label class="label-text-themed-semibold">Description</label>
        <div
          ref="descriptionRef"
          contenteditable="true"
          class="contenteditable-textarea"
          role="textbox"
          data-placeholder="Enter task description..."
          @input="handleDescriptionInput"
          @paste="handleDescriptionPaste"
          @blur="handleDescriptionInput"
        />
      </div>
    </form>
    
    <!-- Comments Section -->
    <TaskComments :task="task" />
  </div>
</template>

<style scoped>
.panel-content {
  @apply p-6;
  @apply text-gray-700 dark:text-gray-300;
}

.contenteditable-input,
.contenteditable-textarea {
  width: 100%;
  min-height: 42px;
  padding: 0.5rem 0.75rem;
  background-color: transparent;
  border-radius: 0.5rem;
  color: rgb(17 24 39);
  outline: none;
  transition: all 0.2s;
}

.dark .contenteditable-input,
.dark .contenteditable-textarea {
  color: rgb(243 244 246);
}

.contenteditable-textarea {
  min-height: 100px;
  resize: vertical;
  white-space: pre-wrap;
}

.contenteditable-input:focus,
.contenteditable-textarea:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .contenteditable-input:focus,
.dark .contenteditable-textarea:focus {
  border-color: rgb(96 165 250);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.contenteditable-input:empty::before,
.contenteditable-textarea:empty::before {
  content: attr(data-placeholder);
  color: rgb(156 163 175);
  pointer-events: none;
}

.dark .contenteditable-input:empty::before,
.dark .contenteditable-textarea:empty::before {
  color: rgb(107 114 128);
}
</style>
