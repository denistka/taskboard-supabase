<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  name: string
  description?: string | null
  isEditing: boolean
}

interface Emits {
  (e: 'update:name', value: string): void
  (e: 'update:description', value: string): void
  (e: 'startEdit', event?: Event): void
  (e: 'blur'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const nameEditRef = ref<HTMLElement | null>(null)
const descriptionEditRef = ref<HTMLElement | null>(null)
const editedName = ref(props.name)
const editedDescription = ref(props.description || '')

// Watch for prop changes
watch(() => [props.name, props.description], ([newName, newDesc]) => {
  if (!props.isEditing) {
    editedName.value = newName
    editedDescription.value = newDesc || ''
  }
})

// Watch for editing state changes
watch(() => props.isEditing, async (editing) => {
  if (editing) {
    editedName.value = props.name
    editedDescription.value = props.description || ''
    
    // Focus on name field after DOM update
    await nextTick()
    if (nameEditRef.value) {
      nameEditRef.value.focus()
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(nameEditRef.value)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }
})

// Handle input updates
const handleNameInput = () => {
  if (!nameEditRef.value) return
  const text = nameEditRef.value.textContent || nameEditRef.value.innerText || ''
  editedName.value = text
  emit('update:name', text)
}

const handleDescriptionInput = () => {
  if (!descriptionEditRef.value) return
  const text = descriptionEditRef.value.textContent || descriptionEditRef.value.innerText || ''
  editedDescription.value = text
  emit('update:description', text)
}

// Handle blur on contenteditable elements
const handleNameBlur = () => {
  if (!props.isEditing) return
  handleNameInput()
  // Small delay to check if focus moved to description field
  setTimeout(() => {
    if (!props.isEditing) return
    const activeElement = document.activeElement as HTMLElement
    const card = nameEditRef.value?.closest('.shadow-lg')
    
    // Don't emit blur if focus moved to notifications
    if (activeElement) {
      const isNotifications = activeElement.closest('[role="alert"]') || activeElement.closest('[aria-live="polite"]')
      if (isNotifications) return
    }
    
    // Emit blur if focus left the card entirely
    if (card && (!activeElement || !card.contains(activeElement))) {
      emit('blur')
    }
  }, 100)
}

const handleDescriptionBlur = () => {
  if (!props.isEditing) return
  handleDescriptionInput()
  // Small delay to check if focus moved to name field
  setTimeout(() => {
    if (!props.isEditing) return
    const activeElement = document.activeElement as HTMLElement
    const card = descriptionEditRef.value?.closest('.shadow-lg')
    
    // Don't emit blur if focus moved to notifications
    if (activeElement) {
      const isNotifications = activeElement.closest('[role="alert"]') || activeElement.closest('[aria-live="polite"]')
      if (isNotifications) return
    }
    
    // Emit blur if focus left the card entirely
    if (card && (!activeElement || !card.contains(activeElement))) {
      emit('blur')
    }
  }, 100)
}

// Expose refs for parent component access
defineExpose({
  nameEditRef,
  descriptionEditRef
})
</script>

<template>
  <div class="flex-1 mb-6">
    <!-- Name -->
    <div
      ref="nameEditRef"
      :contenteditable="isEditing"
      :class="[
        'text-2xl font-bold text-gray-100 mb-2',
        isEditing ? 'border-b-2 border-primary-500/10 min-h-[32px]' : ''
      ]"
      @input="handleNameInput"
      @keydown="handleNameInput"
      @keyup="handleNameInput"
      @paste="handleNameInput"
      @blur="handleNameBlur"
      @click="(e) => isEditing && e.stopPropagation()"
      @mousedown="(e) => isEditing && e.stopPropagation()"
    >{{ isEditing ? editedName : name }}</div>
    
    <!-- Description -->
    <div
      ref="descriptionEditRef"
      :contenteditable="isEditing"
      :class="[
        'text-sm text-gray-400',
        isEditing ? 'border-b-2 border-primary-500/10 min-h-[24px]' : ''
      ]"
      @input="handleDescriptionInput"
      @keydown="handleDescriptionInput"
      @keyup="handleDescriptionInput"
      @paste="handleDescriptionInput"
      @blur="handleDescriptionBlur"
      @click="(e) => isEditing && e.stopPropagation()"
      @mousedown="(e) => isEditing && e.stopPropagation()"
    >{{ isEditing ? (editedDescription || 'No description') : (description || 'No description') }}</div>
  </div>
</template>

<style scoped>
[contenteditable]:focus-visible {
  outline: 2px solid rgba(255, 0, 0, 0.3);
}
</style>

