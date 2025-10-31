<script setup lang="ts">
import { uiBadge } from '../../common/ui'
import BoardActionButtons from './BoardActionButtons.vue'
import BoardDeleteConfirmation from './BoardDeleteConfirmation.vue'

interface Props {
  role?: 'owner' | 'member' | null
  isEditing: boolean
  isSaving: boolean
  isConfirmingDelete: boolean
  hasPendingRequest?: boolean
  pendingRequestsCount?: number
}

interface Emits {
  (e: 'edit', event: Event): void
  (e: 'viewRequests', event: Event): void
  (e: 'delete', event: Event): void
  (e: 'leave', event: Event): void
  (e: 'join', event: Event): void
  (e: 'save', event: Event): void
  (e: 'confirmDelete', event: Event): void
  (e: 'cancelDelete', event: Event): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <!-- Confirm Delete Button (shown when confirming) -->
    <BoardDeleteConfirmation
      v-if="isConfirmingDelete"
      @confirm="(e) => emit('confirmDelete', e)"
      @cancel="(e) => emit('cancelDelete', e)"
    />

    <!-- Normal Footer (when not confirming delete) -->
    <template v-else>
      <!-- Role Badge -->
      <div class="flex-shrink-0">
        <ui-badge v-if="role === 'owner'" variant="primary" size="sm">
          Owner
        </ui-badge>
        <ui-badge v-else-if="role === 'member'" variant="success" size="sm">
          Member
        </ui-badge>
        <ui-badge v-else variant="default" size="sm">
          Public
        </ui-badge>
      </div>

      <!-- Action Buttons -->
      <BoardActionButtons
        :role="role"
        :is-editing="isEditing"
        :is-saving="isSaving"
        :has-pending-request="hasPendingRequest"
        :pending-requests-count="pendingRequestsCount"
        @edit="(e) => emit('edit', e)"
        @view-requests="(e) => emit('viewRequests', e)"
        @delete="(e) => emit('delete', e)"
        @leave="(e) => emit('leave', e)"
        @join="(e) => emit('join', e)"
        @save="(e) => emit('save', e)"
      />
    </template>
  </div>
</template>

