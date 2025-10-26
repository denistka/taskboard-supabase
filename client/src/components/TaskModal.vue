<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ task ? 'Edit Task' : 'New Task' }}</h2>
        <GlassButton @click="close" color="red" size="xs" variant="basic">
          ✕
        </GlassButton>
      </div>
      <form @submit.prevent="handleSubmit">
        <input
          v-model="form.title"
          placeholder="Task title"
          required
          class="input"
        />
        <textarea
          v-model="form.description"
          placeholder="Description"
          rows="4"
          class="textarea"
        />
        <div class="modal-actions">
          <GlassButton v-if="task" type="button" @click="handleDelete" color="red" size="sm" variant="shimmer" class="mr-auto">
            Delete
          </GlassButton>
          <GlassButton type="button" @click="close" color="blue" size="sm" variant="basic">
            Cancel
          </GlassButton>
          <GlassButton type="submit" color="blue" size="sm" variant="shimmer">
            {{ task ? 'Update' : 'Create' }}
          </GlassButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import GlassButton from './GlassButton.vue'
import type { Task } from '../../../shared/types'

const props = defineProps<{
  modelValue: boolean
  task?: Task | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { title: string; description: string }]
  delete: []
}>()

const form = ref({
  title: '',
  description: ''
})

watch(() => props.task, (newTask) => {
  if (newTask) {
    form.value.title = newTask.title
    form.value.description = newTask.description || ''
  } else {
    form.value.title = ''
    form.value.description = ''
  }
}, { immediate: true })

const close = () => emit('update:modelValue', false)
const handleSubmit = () => {
  emit('submit', form.value)
  close()
}
const handleDelete = () => {
  emit('delete')
  close()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
}

.input, .textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  font-family: inherit;
}

.textarea {
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-right: auto;
}

.btn-cancel {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-submit {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
</style>
