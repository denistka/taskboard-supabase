<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { BoardWithRole } from '../../../../../shared/types'
import { uiCard } from '../../common/ui'
import { BoardCardHeader, BoardCardFooter, BoardJoinRequestsOverlay } from '.'

interface Props {
  board: BoardWithRole
  joinRequests?: any[]
  loadingRequests?: boolean
}

interface Emits {
  (e: 'open', boardId: string): void
  (e: 'delete', boardId: string): void
  (e: 'leave', boardId: string): void
  (e: 'join', boardId: string): void
  (e: 'update', boardId: string, data: { name: string; description: string }): void
  (e: 'loadRequests', boardId: string): void
  (e: 'approveRequest', requestId: string): void
  (e: 'rejectRequest', requestId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  joinRequests: () => [],
  loadingRequests: false
})
const emit = defineEmits<Emits>()

// Component refs
const headerRef = ref<InstanceType<typeof BoardCardHeader> | null>(null)

// Edit state
const isEditing = ref(false)
const editedName = ref(props.board.name)
const editedDescription = ref(props.board.description || '')
const isSaving = ref(false)
const lastSavedName = ref(props.board.name)
const lastSavedDescription = ref(props.board.description || '')
const editStartTime = ref(0)

// Join requests overlay state
const showRequestsOverlay = ref(false)

// Delete confirmation state
const isConfirmingDelete = ref(false)

// Watch for board changes to reset edit state
watch(() => props.board, (newBoard) => {
  if (!isEditing.value) {
    editedName.value = newBoard.name
    editedDescription.value = newBoard.description || ''
    lastSavedName.value = newBoard.name
    lastSavedDescription.value = newBoard.description || ''
  }
}, { deep: true })

// Start edit mode
const startEdit = (e?: Event) => {
  if (e) {
    e.stopPropagation()
  }
  
  isEditing.value = true
  editedName.value = props.board.name
  editedDescription.value = props.board.description || ''
  lastSavedName.value = props.board.name
  lastSavedDescription.value = props.board.description || ''
  editStartTime.value = Date.now()
}

// Stop edit mode
const stopEdit = () => {
  isEditing.value = false
}

// Save changes
const saveChanges = async (silent = false) => {
  // Check if there are any changes compared to last saved values
  const hasChanges = 
    editedName.value !== lastSavedName.value ||
    editedDescription.value !== lastSavedDescription.value
  
  if (!hasChanges) {
    if (!silent) {
      stopEdit()
    }
    return
  }

  if (isSaving.value) return
  
  try {
    isSaving.value = true
    emit('update', props.board.id, {
      name: editedName.value.trim(),
      description: editedDescription.value.trim()
    })
    
    // Update last saved values
    lastSavedName.value = editedName.value.trim()
    lastSavedDescription.value = editedDescription.value.trim()
    
    if (!silent) {
      stopEdit()
    }
  } catch (err: any) {
    if (!silent) {
      stopEdit()
    }
  } finally {
    isSaving.value = false
  }
}

// Handle name update from header
const handleNameUpdate = (value: string) => {
  editedName.value = value
}

// Handle description update from header
const handleDescriptionUpdate = (value: string) => {
  editedDescription.value = value
}

// Handle blur from header - save changes
const handleHeaderBlur = () => {
  saveChanges(false)
}

// Handle click outside - save when clicking outside the card
const handleClickOutside = (e: MouseEvent) => {
  if (!isEditing.value) return
  
  // Prevent immediate trigger right after starting edit (within 200ms)
  if (Date.now() - editStartTime.value < 200) return
  
  const nameEditRef = headerRef.value?.nameEditRef
  const card = nameEditRef?.closest('.shadow-lg')
  const target = e.target as HTMLElement
  
  // Don't save if clicking on notifications or other overlays
  const isNotifications = target.closest('[role="alert"]') || target.closest('[aria-live="polite"]')
  const isContentEditable = target.hasAttribute('contenteditable') || target.closest('[contenteditable="true"]')
  
  if (isNotifications || isContentEditable) return
  
  if (card && !card.contains(target)) {
    saveChanges(false)
  }
}

// Add click outside listener when editing
watch(isEditing, (editing) => {
  if (editing) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

// Handle view requests
const handleViewRequests = (e: Event) => {
  e.stopPropagation()
  
  if (!showRequestsOverlay.value) {
    showRequestsOverlay.value = true
    emit('loadRequests', props.board.id)
  } else {
    showRequestsOverlay.value = false
  }
}

// Watch for join requests to show overlay
watch(() => props.joinRequests, (requests) => {
  if (requests && requests.length > 0 && !showRequestsOverlay.value) {
    showRequestsOverlay.value = true
  }
}, { deep: true })

// Handle approve request
const handleApprove = (requestId: string, e: Event) => {
  e.stopPropagation()
  emit('approveRequest', requestId)
  
  // Close overlay if no more requests (will be handled by parent)
  if (!props.joinRequests || props.joinRequests.length <= 1) {
    showRequestsOverlay.value = false
  }
}

// Handle reject request
const handleReject = (requestId: string, e: Event) => {
  e.stopPropagation()
  emit('rejectRequest', requestId)
  
  // Close overlay if no more requests (will be handled by parent)
  if (!props.joinRequests || props.joinRequests.length <= 1) {
    showRequestsOverlay.value = false
  }
}

// Handle delete button click - show confirmation
const handleDeleteClick = (e: Event) => {
  e.stopPropagation()
  isConfirmingDelete.value = true
}

// Handle confirm delete
const handleConfirmDelete = (e: Event) => {
  e.stopPropagation()
  isConfirmingDelete.value = false
  emit('delete', props.board.id)
}

// Handle cancel delete
const handleCancelDelete = (e: Event) => {
  e.stopPropagation()
  isConfirmingDelete.value = false
}

// Handle click outside - cancel delete confirmation
const handleClickOutsideDelete = (e: MouseEvent) => {
  if (!isConfirmingDelete.value) return
  
  const nameEditRef = headerRef.value?.nameEditRef
  const card = nameEditRef?.closest('.shadow-lg')
  const target = e.target as HTMLElement
  
  // Don't cancel if clicking on buttons
  const isButton = target.closest('button') || target.closest('[role="button"]')
  if (isButton) return
  
  if (card && !card.contains(target)) {
    isConfirmingDelete.value = false
  }
}

// Add click outside listener when confirming delete
watch(isConfirmingDelete, (confirming) => {
  if (confirming) {
    document.addEventListener('click', handleClickOutsideDelete)
  } else {
    document.removeEventListener('click', handleClickOutsideDelete)
  }
})

// Handle card click to open board
const handleCardClick = (e: MouseEvent) => {
  // Don't open if in edit mode or confirming delete
  if (isEditing.value || isConfirmingDelete.value) return
  
  // Don't open if clicking on buttons or interactive elements
  const target = e.target as HTMLElement
  const isButton = target.closest('button') || target.closest('[role="button"]')
  const isOverlay = target.closest('.absolute.inset-0')
  const isNotifications = target.closest('[role="alert"]') || target.closest('[aria-live="polite"]')
  
  if (isButton || isOverlay || isNotifications) {
    return
  }
  
  // Only open if user has role (member or owner)
  if (props.board.role) {
    emit('open', props.board.id)
  }
}

// Handle leave board
const handleLeave = (e: Event) => {
  e.stopPropagation()
  emit('leave', props.board.id)
}

// Handle join board
const handleJoin = (e: Event) => {
  e.stopPropagation()
  emit('join', props.board.id)
}

// Handle save from footer
const handleSave = (e: Event) => {
  e.stopPropagation()
  saveChanges(false)
}

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleClickOutsideDelete)
})
</script>

<template>
  <ui-card 
    variant="strong" 
    padding="md" 
    :hover="true" 
    :class="[
      'shadow-lg flex flex-col h-full relative',
      !isEditing && board.role ? 'cursor-pointer' : ''
    ]"
    @click="handleCardClick"
    tabindex="-1"
  >
    <!-- Header: Title and Description -->
    <BoardCardHeader
      ref="headerRef"
      :name="board.name"
      :description="board.description || undefined"
      :is-editing="isEditing"
      @update:name="handleNameUpdate"
      @update:description="handleDescriptionUpdate"
      @blur="handleHeaderBlur"
    />

    <!-- Footer: Role Badge and Action Buttons -->
    <BoardCardFooter
      :role="board.role"
      :is-editing="isEditing"
      :is-saving="isSaving"
      :is-confirming-delete="isConfirmingDelete"
      :has-pending-request="board.has_pending_request"
      :pending-requests-count="board.pending_requests"
      @edit="startEdit"
      @view-requests="handleViewRequests"
      @delete="handleDeleteClick"
      @leave="handleLeave"
      @join="handleJoin"
      @save="handleSave"
      @confirm-delete="handleConfirmDelete"
      @cancel-delete="handleCancelDelete"
    />

    <!-- Join Requests Overlay -->
    <BoardJoinRequestsOverlay
      v-if="showRequestsOverlay"
      :requests="joinRequests"
      :loading="loadingRequests"
      @close="showRequestsOverlay = false"
      @approve="handleApprove"
      @reject="handleReject"
    />
  </ui-card>
</template>
