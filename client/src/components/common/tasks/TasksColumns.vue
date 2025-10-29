<script setup lang="ts">
import TasksColumn from './TasksColumn.vue'
import type { Task, TaskStatus } from '../../../../../shared/types'

interface ColumnConfig {
  title: string
  status: TaskStatus
  color: 'red' | 'yellow' | 'green'
}

interface Props {
  todoTasks: Task[]
  inProgressTasks: Task[]
  doneTasks: Task[]
}

interface Emits {
  (e: 'taskClick', task: Task): void
  (e: 'createTask', status: string, title: string, description: string): void
  (e: 'taskMoved', taskId: string, newStatus: string, newPosition: number): void
  (e: 'taskDelete', taskId: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const columns: ColumnConfig[] = [
  { title: 'To Do', status: 'todo', color: 'red' },
  { title: 'In Progress', status: 'in_progress', color: 'yellow' },
  { title: 'Done', status: 'done', color: 'green' }
]

const getTasksForColumn = (status: TaskStatus, props: Props): Task[] => {
  switch (status) {
    case 'todo': return props.todoTasks
    case 'in_progress': return props.inProgressTasks
    case 'done': return props.doneTasks
    default: return []
  }
}

const handleTaskClick = (task: Task) => {
  emit('taskClick', task)
}

const handleCreateTask = (status: string, title: string, description: string) => {
  emit('createTask', status, title, description)
}

const handleTaskMoved = (taskId: string, newStatus: string, newPosition: number) => {
  emit('taskMoved', taskId, newStatus, newPosition)
}

const handleTaskDelete = (taskId: string) => {
  emit('taskDelete', taskId)
}
</script>

<template> 
  <div class="flex gap-6 w-full h-full overflow-x-auto p-6 pb-0">
    <TasksColumn
      v-for="column in columns"
      :key="column.status"
      :title="column.title"
      :status="column.status"
      :color="column.color"
      :tasks="getTasksForColumn(column.status, $props)"
      @taskClick="handleTaskClick"
      @createTask="handleCreateTask"
      @taskMoved="handleTaskMoved"
      @taskDelete="handleTaskDelete"
    />
  </div>
</template>

