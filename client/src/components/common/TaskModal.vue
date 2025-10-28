<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from './Modal.vue'
import { uiButton, uiInput } from './ui'
import type { Task } from '../../../../shared/types'

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

const handleSubmit = () => {
  emit('submit', form.value)
  emit('update:modelValue', false)
}

const handleDelete = () => {
  emit('delete')
  emit('update:modelValue', false)
}
</script>

<template>
  <Modal 
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="task ? 'Edit Task' : 'New Task'"
    width="md"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="label-text-themed-semibold">Task Title</label>
        <ui-input
          v-model="form.title"
          placeholder="Enter task title"
          :required="true"
        />
      </div>
      
      <div>
        <label class="label-text-themed-semibold">Description</label>
        <ui-input
          v-model="form.description"
          placeholder="Enter task description (optional)"
          :rows="4"
        />
      </div>
    </form>

    <template #actions>
      <ui-button 
        v-if="task" 
        type="button" 
        @click="handleDelete" 
        color="red" 
        size="md" 
        variant="shimmer" 
        class="mr-auto"
      >
        Delete
      </ui-button>
      <ui-button 
        type="button" 
        @click="$emit('update:modelValue', false)" 
        color="blue" 
        size="md" 
        variant="basic"
      >
        Cancel
      </ui-button>
      <ui-button 
        @click="handleSubmit"
        color="purple" 
        size="md" 
        variant="shimmer"
      >
        {{ task ? 'Update' : 'Create' }}
      </ui-button>
    </template>
  </Modal>
</template>
