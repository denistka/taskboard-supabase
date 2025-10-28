<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBoards } from '../../composables/useBoards'
import { useToast } from '../../composables/useNotification'
import PageLayout from '../wrappers/PageLayout.vue'
import SkeletonList from '../common/skeleton/SkeletonList.vue'
import BoardCard from '../common/BoardCard.vue'
import CreateBoardModal from '../common/CreateBoardModal.vue'
import EditBoardModal from '../common/EditBoardModal.vue'
import JoinRequestsModal from '../common/JoinRequestsModal.vue'
import ConfirmModal from '../common/ConfirmModal.vue'
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

// State
const loading = ref(true)

// Create Modal State
const showCreateModal = ref(false)

// Edit Modal State
const showEditModal = ref(false)
const editingBoard = ref<BoardWithRole | null>(null)

// Join Requests Modal State
const showRequestsModal = ref(false)
const loadingRequests = ref(false)
const joinRequests = ref<any[]>([])

// Confirmation Modal State
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

// Watch for create action from header
watch(() => route.query.action, (action) => {
  if (action === 'create') {
    showCreateModal.value = true
    // Clean up query param
    router.replace({ path: route.path, query: {} })
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  await list()
  loading.value = false
})

// Board actions
const openBoard = (boardId: string) => {
  router.push(`/board/${boardId}`)
}

const handleCreateBoard = async (name: string, description: string) => {
  try {
    await create(name, description)
    toast.success('Board created successfully')
    showCreateModal.value = false
  } catch (err: any) {
    toast.error(err.message || 'Failed to create board')
  }
}

const editBoard = (board: BoardWithRole) => {
  editingBoard.value = board
  showEditModal.value = true
}

const handleSaveBoard = async (boardId: string, data: { name: string; description: string }) => {
  try {
    await update(boardId, data)
    toast.success('Board updated successfully')
    showEditModal.value = false
    editingBoard.value = null
  } catch (err: any) {
    toast.error(err.message || 'Failed to update board')
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

// Join requests handlers
const viewRequests = async (boardId: string) => {
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
  try {
    await approveJoin(requestId)
    joinRequests.value = joinRequests.value.filter(r => r.id !== requestId)
    toast.success('Request approved')
  } catch (err: any) {
    toast.error(err.message || 'Failed to approve request')
  }
}

const handleRejectRequest = async (requestId: string) => {
  try {
    await rejectJoin(requestId)
    joinRequests.value = joinRequests.value.filter(r => r.id !== requestId)
    toast.success('Request rejected')
  } catch (err: any) {
    toast.error(err.message || 'Failed to reject request')
  }
}

// Confirmation handler
const handleConfirm = async () => {
  if (confirmAction.value) {
    try {
      await confirmAction.value()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    }
  }
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
        <!-- Boards Grid -->
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <!-- Existing Boards -->
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

  <!-- Create Board Modal -->
  <CreateBoardModal
    v-model="showCreateModal"
    @create="handleCreateBoard"
  />

  <!-- Edit Board Modal -->
  <EditBoardModal
    v-model="showEditModal"
    :board="editingBoard"
    @save="handleSaveBoard"
  />

  <!-- Join Requests Modal -->
  <JoinRequestsModal
    v-model="showRequestsModal"
    :requests="joinRequests"
    :loading="loadingRequests"
    @approve="handleApproveRequest"
    @reject="handleRejectRequest"
  />

  <!-- Confirmation Modal -->
  <ConfirmModal
    v-model="showConfirmModal"
    :message="confirmMessage"
    @confirm="handleConfirm"
  />
</template>

