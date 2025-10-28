<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBoards } from '../../composables/useBoards'
import { useToast } from '../../composables/useNotification'
import PageLayout from '../wrappers/PageLayout.vue'
import SkeletonList from '../common/skeleton/SkeletonList.vue'
import BoardCard from '../common/BoardCard.vue'
import Modal from '../common/Modal.vue'
import { uiButton, uiInput, uiCard, uiAvatar } from '../common/ui'
import type { BoardWithRole } from '../../../../shared/types'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { 
  boards, 
  list, 
  create, 
  update, 
  remove, 
  requestJoin, 
  leave, 
  approveJoin, 
  rejectJoin, 
  listRequests 
} = useBoards()

// Loading state
const loading = ref(true)

// Create/Edit modal
const showCreateModal = ref(false)
const editingBoard = ref<BoardWithRole | null>(null)
const boardForm = ref({ name: '', description: '' })

// Join requests modal
const showRequestsModal = ref(false)
const loadingRequests = ref(false)
const joinRequests = ref<any[]>([])
const currentRequestBoardId = ref<string | null>(null)

// Confirmation modal
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

// Lifecycle
onMounted(async () => {
  await list()
  loading.value = false
  
  // Check if we need to open create modal
  if (route.query.action === 'create') {
    createBoard()
    // Clear query param
    router.replace('/boards')
  }
})

// Watch for query changes
watch(() => route.query.action, (action) => {
  if (action === 'create') {
    createBoard()
    // Clear query param
    router.replace('/boards')
  }
})

// Board actions
const openBoard = (boardId: string) => {
  router.push(`/board/${boardId}`)
}

const createBoard = () => {
  editingBoard.value = null
  boardForm.value = { name: '', description: '' }
  showCreateModal.value = true
}

const editBoard = (board: BoardWithRole) => {
  editingBoard.value = board
  boardForm.value = { name: board.name, description: board.description || '' }
  showCreateModal.value = true
}

const handleSaveBoard = async () => {
  try {
    if (editingBoard.value) {
      await update(editingBoard.value.id, boardForm.value)
      toast.success('Board updated successfully')
    } else {
      await create(boardForm.value.name, boardForm.value.description)
      toast.success('Board created successfully')
    }
    closeModal()
  } catch (err: any) {
    toast.error(err.message || 'Failed to save board')
  }
}

const deleteBoard = (boardId: string) => {
  confirmMessage.value = 'Delete this board? All tasks will be lost.'
  confirmAction.value = async () => {
    await remove(boardId)
    toast.success('Board deleted successfully')
  }
  showConfirmModal.value = true
}

const leaveBoard = (boardId: string) => {
  confirmMessage.value = 'Leave this board? You will need to request to join again.'
  confirmAction.value = async () => {
    await leave(boardId)
    toast.success('Left board successfully')
  }
  showConfirmModal.value = true
}

const joinBoard = async (boardId: string) => {
  try {
    await requestJoin(boardId)
    toast.success('Join request sent! Wait for owner approval.')
  } catch (err: any) {
    toast.error(err.message || 'Failed to send join request')
  }
}

// Join requests
const viewRequests = async (boardId: string) => {
  currentRequestBoardId.value = boardId
  showRequestsModal.value = true
  loadingRequests.value = true
  
  try {
    const requests = await listRequests(boardId)
    joinRequests.value = requests
  } catch (err: any) {
    toast.error(err.message || 'Failed to load requests')
  } finally {
    loadingRequests.value = false
  }
}

const handleApproveRequest = async (requestId: string) => {
  if (!currentRequestBoardId.value) return
  
  try {
    await approveJoin(requestId)
    joinRequests.value = joinRequests.value.filter(r => r.id !== requestId)
    toast.success('Request approved')
  } catch (err: any) {
    toast.error(err.message || 'Failed to approve request')
  }
}

const handleRejectRequest = async (requestId: string) => {
  if (!currentRequestBoardId.value) return
  
  try {
    await rejectJoin(requestId)
    joinRequests.value = joinRequests.value.filter(r => r.id !== requestId)
    toast.success('Request rejected')
  } catch (err: any) {
    toast.error(err.message || 'Failed to reject request')
  }
}

// Modal helpers
const closeModal = () => {
  showCreateModal.value = false
  editingBoard.value = null
  boardForm.value = { name: '', description: '' }
}

const closeRequestsModal = () => {
  showRequestsModal.value = false
  currentRequestBoardId.value = null
  joinRequests.value = []
}

const handleConfirm = async () => {
  if (confirmAction.value) {
    try {
      await confirmAction.value()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    }
  }
  showConfirmModal.value = false
  confirmAction.value = null
  confirmMessage.value = ''
}

const handleCancelConfirm = () => {
  showConfirmModal.value = false
  confirmAction.value = null
  confirmMessage.value = ''
}
</script>

<template>
  <PageLayout>
    <!-- Skeleton Loading -->
    <template #page-skeleton>
      <SkeletonList v-if="loading" variant="list" :columns="3" :items-per-column="2" />
    </template>
    
    <!-- Main Content -->
    <template #content>
      <div v-if="!loading" class="min-h-screen p-6">
        
        <!-- Empty State -->
        <div v-if="boards.length === 0" class="text-center py-20">
          <svg 
            class="w-20 h-20 mx-auto mb-6 text-gray-400 dark:text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="text-xl text-gray-600 dark:text-gray-400">
            No boards yet. Create your first board!
          </p>
        </div>

        <!-- Boards Grid -->
        <div v-else class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <BoardCard
              v-for="board in boards"
              :key="board.id"
              :board="board"
              @open="openBoard"
              @edit="editBoard"
              @delete="deleteBoard"
              @leave="leaveBoard"
              @join="joinBoard"
              @viewRequests="viewRequests"
            />
          </div>
        </div>
      </div>
    </template>
  </PageLayout>

  <!-- Create/Edit Board Modal -->
  <Modal 
    v-model="showCreateModal" 
    :title="editingBoard ? 'Edit Board' : 'Create Board'"
    width="md"
  >
    <form @submit.prevent="handleSaveBoard" class="space-y-4">
      <div>
        <label class="label-text-themed-semibold">Board Name</label>
        <ui-input 
          v-model="boardForm.name" 
          :required="true" 
          placeholder="Enter board name" 
        />
      </div>
      
      <div>
        <label class="label-text-themed-semibold">Description</label>
        <ui-input 
          v-model="boardForm.description" 
          :rows="3" 
          placeholder="Enter board description (optional)" 
        />
      </div>
    </form>

    <template #actions>
      <ui-button 
        type="button" 
        @click="closeModal" 
        color="blue" 
        size="md" 
        variant="basic"
      >
        Cancel
      </ui-button>
      <ui-button 
        @click="handleSaveBoard"
        color="purple" 
        size="md" 
        variant="shimmer"
      >
        {{ editingBoard ? 'Update' : 'Create' }}
      </ui-button>
    </template>
  </Modal>

  <!-- Join Requests Modal -->
  <Modal 
    v-model="showRequestsModal" 
    title="Join Requests"
    width="lg"
  >
    <div v-if="loadingRequests" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
    </div>

    <div v-else-if="joinRequests.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No pending requests</p>
    </div>

    <div v-else class="space-y-3">
      <ui-card 
        v-for="request in joinRequests" 
        :key="request.id" 
        variant="subtle" 
        padding="sm"
        class="flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <ui-avatar 
            :email="request.user.email" 
            size="md"
          />
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100">
              {{ request.user.full_name || request.user.email }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ request.user.email }}
            </p>
          </div>
        </div>
        
        <div class="flex gap-2">
          <ui-button 
            @click="handleApproveRequest(request.id)" 
            color="green" 
            size="sm" 
            variant="neon"
          >
            Approve
          </ui-button>
          <ui-button 
            @click="handleRejectRequest(request.id)" 
            color="red" 
            size="sm" 
            variant="neon"
          >
            Reject
          </ui-button>
        </div>
      </ui-card>
    </div>

    <template #actions>
      <ui-button 
        @click="closeRequestsModal" 
        color="blue" 
        size="md" 
        variant="basic"
      >
        Close
      </ui-button>
    </template>
  </Modal>

  <!-- Confirmation Modal -->
  <Modal 
    v-model="showConfirmModal" 
    title="Confirm Action"
    width="sm"
  >
    <p class="text-gray-700 dark:text-gray-300">
      {{ confirmMessage }}
    </p>

    <template #actions>
      <ui-button 
        @click="handleCancelConfirm" 
        color="blue" 
        size="md" 
        variant="basic"
      >
        Cancel
      </ui-button>
      <ui-button 
        @click="handleConfirm" 
        color="red" 
        size="md" 
        variant="shimmer"
      >
        Confirm
      </ui-button>
    </template>
  </Modal>
</template>

