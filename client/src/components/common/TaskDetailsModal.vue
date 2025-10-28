<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'
import { uiButton, uiInput } from './ui'
import type { Task } from '../../../../shared/types'

interface Props {
  task: Task | null
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', title: string, description: string): void
  (e: 'delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const taskTitle = computed({
  get: () => props.task?.title || '',
  set: (value: string) => {
    if (props.task) {
      props.task.title = value
    }
  }
})

const taskDescription = computed({
  get: () => props.task?.description || '',
  set: (value: string) => {
    if (props.task) {
      props.task.description = value
    }
  }
})

const handleSave = () => {
  emit('save', taskTitle.value, taskDescription.value)
}

const handleDelete = () => {
  emit('delete')
}

const handleClose = (val: boolean) => {
  if (!val) {
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="handleClose"
    title="Task Details"
    width="md"
  >
    <form @submit.prevent="handleSave" class="space-y-4">
      <div>
        <label class="label-text-themed-semibold">Title</label>
        <ui-input v-model="taskTitle" :required="true" />
      </div>

      <div>
        <label class="label-text-themed-semibold">Description</label>
        <ui-input v-model="taskDescription" :rows="4" />
      </div>
    </form>

    <template #actions>
      <ui-button 
        type="button" 
        @click="handleDelete" 
        color="red" 
        size="md" 
        variant="shimmer"
        aria-label="Delete task"
      >
        Delete
      </ui-button>
      <ui-button 
        @click="handleSave"
        color="purple" 
        size="md" 
        variant="shimmer"
        aria-label="Save task changes"
      >
        Save Changes
      </ui-button>
    </template>
  </Modal>
</template>

