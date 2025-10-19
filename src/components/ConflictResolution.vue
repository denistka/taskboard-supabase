<script setup lang="ts">
import { ref } from 'vue'

interface ConflictData {
  field: string
  localValue: any
  remoteValue: any
  remoteUser: string
}

interface Props {
  conflicts: ConflictData[]
  visible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  resolve: [field: string, value: any]
  dismiss: []
}>()

const resolvedValues = ref<Record<string, any>>({})

const getFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    status: 'Status'
  }
  return labels[field] || field
}

const resolveConflict = (field: string, value: any) => {
  resolvedValues.value[field] = value
  emit('resolve', field, value)
}

const useLocalValue = (field: string, localValue: any) => {
  resolveConflict(field, localValue)
}

const useRemoteValue = (field: string, remoteValue: any) => {
  resolveConflict(field, remoteValue)
}

const isResolved = (field: string) => {
  return field in resolvedValues.value
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible && conflicts.length > 0" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Resolve Conflicts</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            This task was modified by another user. Choose which version to keep for each field.
          </p>
        </div>

        <!-- Conflicts -->
        <div class="p-6 space-y-6">
          <div
            v-for="conflict in conflicts"
            :key="conflict.field"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">
              {{ getFieldLabel(conflict.field) }}
            </h4>
            
            <div class="space-y-3">
              <!-- Local version -->
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your version:</p>
                  <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border">
                    <p class="text-sm text-gray-900 dark:text-gray-100">
                      {{ conflict.localValue }}
                    </p>
                  </div>
                  <button
                    @click="useLocalValue(conflict.field, conflict.localValue)"
                    :disabled="isResolved(conflict.field)"
                    class="mt-2 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use this version
                  </button>
                </div>
              </div>

              <!-- Remote version -->
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ conflict.remoteUser }}'s version:
                  </p>
                  <div class="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border">
                    <p class="text-sm text-gray-900 dark:text-gray-100">
                      {{ conflict.remoteValue }}
                    </p>
                  </div>
                  <button
                    @click="useRemoteValue(conflict.field, conflict.remoteValue)"
                    :disabled="isResolved(conflict.field)"
                    class="mt-2 px-3 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use this version
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button
            @click="emit('dismiss')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
