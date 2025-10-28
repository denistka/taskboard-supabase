<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import type { BoardWithRole } from '../../../../shared/types'
import { uiButton, uiBadge, uiCard, uiAvatar } from './ui'
import { IconExternalLink, IconEdit, IconBell, IconTrash, IconLogout, IconUserPlus, IconClock, IconCheckCircle, IconXCircle, IconClose } from './icons'
import { useBoards } from '../../composables/useBoards'
import { useToast } from '../../composables/useNotification'

interface Props {
  board: BoardWithRole
}

interface Emits {
  (e: 'open', boardId: string): void
  (e: 'delete', boardId: string): void
  (e: 'leave', boardId: string): void
  (e: 'join', boardId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { update, listRequests, approveJoin, rejectJoin } = useBoards()
const toast = useToast()

// Edit state
const isEditing = ref(false)
const editedName = ref(props.board.name)
const editedDescription = ref(props.board.description || '')
const autoSaveTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const isSaving = ref(false)
const nameEditRef = ref<HTMLElement | null>(null)
const descriptionEditRef = ref<HTMLElement | null>(null)
const lastSavedName = ref(props.board.name)
const lastSavedDescription = ref(props.board.description || '')
const editStartTime = ref(0)

// Join requests overlay state
const showRequestsOverlay = ref(false)
const loadingRequests = ref(false)
const joinRequests = ref<any[]>([])

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
const startEdit = async (e?: Event) => {
  // Prevent event propagation to avoid triggering click outside immediately
  if (e) {
    e.stopPropagation()
  }
  
  isEditing.value = true
  editedName.value = props.board.name
  editedDescription.value = props.board.description || ''
  lastSavedName.value = props.board.name
  lastSavedDescription.value = props.board.description || ''
  editStartTime.value = Date.now()
  
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

// Stop edit mode
const stopEdit = () => {
  isEditing.value = false
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
    autoSaveTimeout.value = null
  }
}

// Debounced auto-save function
const scheduleAutoSave = () => {
  // Only schedule if we're in edit mode
  if (!isEditing.value) return
  
  // Clear any existing timeout
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
    autoSaveTimeout.value = null
  }
  
  // Set a new timeout for 3 seconds
  autoSaveTimeout.value = setTimeout(() => {
    if (isEditing.value) {
      saveChanges(true) // Silent save - no toast, no exit from edit mode
    }
  }, 3000)
}

// Save changes
const saveChanges = async (silent = false) => {
  // Clear any pending auto-save timeout when manually saving
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
    autoSaveTimeout.value = null
  }
  
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
    await update(props.board.id, {
      name: editedName.value.trim(),
      description: editedDescription.value.trim()
    })
    
    // Update last saved values
    lastSavedName.value = editedName.value.trim()
    lastSavedDescription.value = editedDescription.value.trim()
    
    if (!silent) {
      toast.success('Board updated successfully')
      stopEdit()
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to update board')
    if (!silent) {
      stopEdit()
    }
  } finally {
    isSaving.value = false
  }
}

// Handle input updates
const handleNameInput = () => {
  if (!nameEditRef.value) return
  editedName.value = nameEditRef.value.textContent || ''
  scheduleAutoSave()
}

const handleDescriptionInput = () => {
  if (!descriptionEditRef.value) return
  editedDescription.value = descriptionEditRef.value.textContent || ''
  scheduleAutoSave()
}

// Handle click outside - save when clicking outside the card
const handleClickOutside = (e: MouseEvent) => {
  if (!isEditing.value) return
  
  // Prevent immediate trigger right after starting edit (within 200ms)
  if (Date.now() - editStartTime.value < 200) return
  
  const card = nameEditRef.value?.closest('.shadow-lg')
  const target = e.target as HTMLElement
  
  if (card && !card.contains(target)) {
    saveChanges(false)
  }
}

// Handle card blur - save when focus leaves the card
const handleCardBlur = () => {
  if (!isEditing.value) return
  
  // Small delay to check if focus moved to another element in the card
  setTimeout(() => {
    if (!isEditing.value) return
    
    const card = nameEditRef.value?.closest('.shadow-lg')
    const activeElement = document.activeElement as HTMLElement
    
    if (card && (!activeElement || !card.contains(activeElement))) {
      saveChanges(false)
    }
  }, 100)
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
const handleViewRequests = async (e: Event) => {
  if (e) {
    e.stopPropagation()
  }
  
  if (!showRequestsOverlay.value) {
    showRequestsOverlay.value = true
    loadingRequests.value = true
    
    try {
      const requests = await listRequests(props.board.id)
      joinRequests.value = requests
    } catch (err: any) {
      toast.error(err.message || 'Failed to load requests')
      showRequestsOverlay.value = false
    } finally {
      loadingRequests.value = false
    }
  } else {
    showRequestsOverlay.value = false
  }
}

// Handle approve request
const handleApprove = async (requestId: string, e: Event) => {
  if (e) {
    e.stopPropagation()
  }
  
  try {
    await approveJoin(requestId)
    joinRequests.value = joinRequests.value.filter(r => r.id !== requestId)
    toast.success('Request approved')
    
    if (joinRequests.value.length === 0) {
      showRequestsOverlay.value = false
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to approve request')
  }
}

// Handle reject request
const handleReject = async (requestId: string, e: Event) => {
  if (e) {
    e.stopPropagation()
  }
  
  try {
    await rejectJoin(requestId)
    joinRequests.value = joinRequests.value.filter(r => r.id !== requestId)
    toast.warning('Request rejected')
    
    if (joinRequests.value.length === 0) {
      showRequestsOverlay.value = false
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to reject request')
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <ui-card 
    variant="strong" 
    padding="md" 
    :hover="true" 
    class="shadow-lg flex flex-col h-full relative"
    @blur="handleCardBlur"
    tabindex="-1"
  >
    <!-- Header: Title and Description -->
    <div class="flex-1 mb-6">
      <h3
        v-if="!isEditing"
        class="text-2xl font-bold text-gray-100 mb-2"
      >
        {{ board.name }}
      </h3>
      <div
        v-else
        ref="nameEditRef"
        contenteditable="true"
        class="text-2xl font-bold text-gray-100 mb-2 border-b-2 border-cyan-500/10 min-h-[32px]"
        @input="handleNameInput"
        @keyup="handleNameInput"
        @paste="handleNameInput"
      >{{ editedName }}</div>
      
      <p
        v-if="!isEditing"
        class="text-sm text-gray-400"
      >
        {{ board.description || 'No description' }}
      </p>
      <div
        v-else
        ref="descriptionEditRef"
        contenteditable="true"
        class="text-sm text-gray-400 border-b-2 border-cyan-500/10 min-h-[24px]"
        @input="handleDescriptionInput"
        @keyup="handleDescriptionInput"
        @paste="handleDescriptionInput"
      >{{ editedDescription || 'No description' }}</div>
    </div>

    <!-- Footer: Role Badge and Action Buttons -->
    <div class="flex items-center justify-between gap-3">
      <!-- Role Badge -->
      <div class="flex-shrink-0">
        <ui-badge v-if="board.role === 'owner'" variant="primary" size="sm">
          Owner
        </ui-badge>
        <ui-badge v-else-if="board.role === 'member'" variant="success" size="sm">
          Member
        </ui-badge>
        <ui-badge v-else variant="default" size="sm">
          Public
        </ui-badge>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <template v-if="!isEditing">
          <!-- Open Button (for members and owners) -->
          <ui-button 
            v-if="board.role" 
            @click="emit('open', board.id)"
            color="blue"
            size="xs"
            variant="neon"
            title="Open Board"
            aria-label="Open board"
          >
            <IconExternalLink :size="16" />
          </ui-button>

          <!-- Edit Button (owner only) -->
          <ui-button 
            v-if="board.role === 'owner'" 
            @click="(e) => startEdit(e)"
            color="cyan"
            size="xs"
            variant="neon"
            title="Edit"
            aria-label="Edit board"
          >
            <IconEdit :size="16" />
          </ui-button>

          <!-- View Requests Button (owner only) -->
          <ui-button 
            v-if="board.role === 'owner'" 
            @click="handleViewRequests"
            color="yellow"
            size="xs"
            :variant="board.pending_requests ? 'shimmer' : 'neon'"
            class="relative"
            title="View Requests"
            :aria-label="board.pending_requests ? `View ${board.pending_requests} pending requests` : 'View join requests'"
          >
            <IconBell :size="16" />
            <span v-if="board.pending_requests" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {{ board.pending_requests }}
            </span>
          </ui-button>

          <!-- Delete Button (owner only) -->
          <ui-button 
            v-if="board.role === 'owner'" 
            @click="emit('delete', board.id)"
            color="red"
            size="xs"
            variant="neon"
            title="Delete"
            aria-label="Delete board"
          >
            <IconTrash :size="16" />
          </ui-button>

          <!-- Leave Button (member only, not owner) -->
          <ui-button 
            v-if="board.role === 'member'" 
            @click="emit('leave', board.id)"
            color="red"
            size="xs"
            variant="neon"
            title="Leave Board"
            aria-label="Leave board"
          >
            <IconLogout :size="16" />
          </ui-button>

          <!-- Join Request Button (non-member) -->
          <ui-button 
            v-if="!board.role" 
            @click="emit('join', board.id)"
            :color="board.has_pending_request ? 'yellow' : 'green'"
            size="xs"
            :variant="board.has_pending_request ? 'shimmer' : 'neon'"
            :disabled="board.has_pending_request"
            :title="board.has_pending_request ? 'Request Pending' : 'Request to Join'"
            :aria-label="board.has_pending_request ? 'Join request pending' : 'Request to join board'"
          >
            <IconUserPlus v-if="!board.has_pending_request" :size="16" />
            <IconClock v-else :size="16" />
          </ui-button>
        </template>

        <!-- Save Button (edit mode only) -->
        <ui-button 
          v-if="isEditing" 
          @click="saveChanges(false)"
          color="green"
          size="xs"
          variant="neon"
          :disabled="isSaving"
          title="Save Changes"
          aria-label="Save board changes"
        >
          <IconCheckCircle :size="16" />
        </ui-button>
      </div>
    </div>

    <!-- Join Requests Overlay -->
    <div
      v-if="showRequestsOverlay"
      class="absolute inset-0 bg-white/60 dark:bg-gray-900/90 backdrop-blur border border-white/30 dark:border-gray-700/40 rounded-lg z-50 flex flex-col shadow-2xl overflow-hidden"
      style="backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between py-2 px-2 ">
        <h4 class="text-base font-semibold text-gray-900 dark:text-white">Join Requests</h4>
        <ui-button
          @click="showRequestsOverlay = false"
          color="red"
          size="xs"
          variant="neon"
          title="Close"
        >
          <IconClose :size="14" />
        </ui-button>
      </div>

      <!-- Requests List (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-1 space-y-3">
        <!-- Loading State -->
        <div v-if="loadingRequests" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="joinRequests.length === 0" class="flex items-center justify-center py-8 px-4">
          <p class="text-sm text-gray-400">No pending requests</p>
        </div>

        <!-- Requests List -->
        <div v-else v-for="request in joinRequests" :key="request.id" class="flex items-center justify-between gap-3 p-1 rounded-lg">
          <!-- User Info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <ui-avatar
              :initials="(request.profiles?.full_name?.[0] || request.profiles?.email?.[0] || '?').toUpperCase()"
              size="sm"
              color="bg-cyan-500"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">
                {{ request.profiles?.full_name || 'Unknown User' }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ request.profiles?.email }}
              </p>
            </div>
          </div>

          <!-- Action Buttons (Icon Only) -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <ui-button
              @click="(e) => handleApprove(request.id, e)"
              color="green"
              size="xs"
              variant="neon"
              title="Approve"
              class="p-2"
            >
              <IconCheckCircle :size="14" />
            </ui-button>
            <ui-button
              @click="(e) => handleReject(request.id, e)"
              color="red"
              size="xs"
              variant="neon"
              title="Reject"
              class="p-2"
            >
              <IconXCircle :size="14" />
            </ui-button>
          </div>
        </div>
      </div>
    </div>
  </ui-card>
</template>
