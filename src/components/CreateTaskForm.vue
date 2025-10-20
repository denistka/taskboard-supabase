<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  create: [title: string, description: string]
  cancel: []
}>()

const title = ref('')
const description = ref('')

const handleCreate = () => {
  if (title.value.trim()) {
    emit('create', title.value, description.value)
    title.value = ''
    description.value = ''
  }
}

const handleCancel = () => {
  title.value = ''
  description.value = ''
  emit('cancel')
}
</script>

<template>
  <div class="card p-4 mb-4 space-y-3 bg-gray-50 dark:bg-gray-800/50 animate-slide-in">
    <input
      v-model="title"
      type="text"
      placeholder="Task title..."
      class="input text-sm"
      @keyup.enter="handleCreate"
      autofocus
    />
    <textarea
      v-model="description"
      placeholder="Description (optional)..."
      class="input text-sm min-h-[80px] resize-none"
      rows="3"
    />
    <div class="flex gap-2">
      <button
        @click="handleCreate"
        class="btn-primary text-sm px-4 py-2"
        :disabled="!title.trim()"
      >
        Add Task
      </button>
      <button
        @click="handleCancel"
        class="btn-secondary text-sm px-4 py-2"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

