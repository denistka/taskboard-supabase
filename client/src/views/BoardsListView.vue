<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useBoards } from '../composables/useBoards'
import { usePresence } from '../composables/presence/usePresence'
import PageContainer from '../components/Page/PageContainer.vue'
import PageHeader from '../components/Page/PageHeader.vue'
import BoardCard from '../components/BoardCard.vue'
import GlassButton from '../components/GlassButton.vue'
import AppPresenceIndicator from '../components/AppPresenceIndicator.vue'
import type { BoardWithRole } from '../../../shared/types'

const router = useRouter()
const { signOut } = useAuth()
const { boards, list, create, update, remove, requestJoin, leave, approveJoin, rejectJoin, listRequests } = useBoards()
const presence = usePresence()

const loading = ref(true)
const showCreateModal = ref(false)
const editingBoard = ref<BoardWithRole | null>(null)
const boardForm = ref({ name: '', description: '' })

const showRequestsModal = ref(false)
const loadingRequests = ref(false)
const joinRequests = ref<any[]>([])
const currentRequestBoardId = ref<string | null>(null)

onMounted(async () => {
  await list()
  await presence.app.join()
  loading.value = false
})

onUnmounted(() => {
  presence.app.unsubscribe()
})

const openBoard = (boardId: string) => {
  router.push(`/board/${boardId}`)
}

const editBoard = (board: BoardWithRole) => {
  editingBoard.value = board
  boardForm.value = { name: board.name, description: board.description || '' }
}

const viewRequests = async (boardId: string) => {
  currentRequestBoardId.value = boardId
  showRequestsModal.value = true
  loadingRequests.value = true
  
  try {
    const requests = await listRequests(boardId)
    joinRequests.value = requests
  } catch (err: any) {
    alert(err.message || 'Failed to load requests')
  } finally {
    loadingRequests.value = false
  }
}

const deleteBoard = async (boardId: string) => {
  if (confirm('Delete this board? All tasks will be lost.')) {
    await remove(boardId)
  }
}

const handleSaveBoard = async () => {
  if (editingBoard.value) {
    await update(editingBoard.value.id, boardForm.value)
  } else {
    await create(boardForm.value.name, boardForm.value.description)
  }
  closeModal()
}

const closeModal = () => {
  showCreateModal.value = false
  editingBoard.value = null
  boardForm.value = { name: '', description: '' }
}

const joinBoard = async (boardId: string) => {
  try {
    await requestJoin(boardId)
    alert('Join request sent! Wait for owner approval.')
    // Real-time will update the list automatically
  } catch (err: any) {
    alert(err.message || 'Failed to send join request')
  }
}

const leaveBoard = async (boardId: string) => {
  if (confirm('Leave this board?')) {
    await leave(boardId)
  }
}

const handleApprove = async (requestId: string) => {
  try {
    await approveJoin(requestId)
    // Refresh requests list in modal
    if (currentRequestBoardId.value) {
      const requests = await listRequests(currentRequestBoardId.value)
      joinRequests.value = requests
    }
    // Real-time will update boards list automatically
  } catch (err: any) {
    alert(err.message || 'Failed to approve request')
  }
}

const handleReject = async (requestId: string) => {
  try {
    await rejectJoin(requestId)
    // Refresh requests list in modal
    if (currentRequestBoardId.value) {
      const requests = await listRequests(currentRequestBoardId.value)
      joinRequests.value = requests
    }
    // Real-time will update boards list automatically
  } catch (err: any) {
    alert(err.message || 'Failed to reject request')
  }
}

const closeRequestsModal = () => {
  showRequestsModal.value = false
  joinRequests.value = []
  currentRequestBoardId.value = null
}

const handleSignOut = async () => {
  // Leave all presence (board + app)
  await presence.leaveAll()
  presence.app.unsubscribe()
  await signOut()
  router.push('/')
}
</script>

<template>
  <PageContainer>
    <div class="min-h-screen">
      <PageHeader title="My Boards">
        <template #right>
          <GlassButton @click="showCreateModal = true" variant="shimmer" color="purple" size="md">
            + Create Board
          </GlassButton>
          <GlassButton @click="$router.push('/profile')" variant="neon" color="blue" size="md">
            Profile
          </GlassButton>
          <AppPresenceIndicator :onlineUsers="presence.app.users.value" />
          <GlassButton @click="handleSignOut" variant="neon" color="red" size="md">
            Sign Out
          </GlassButton>
        </template>
      </PageHeader>

      <div class="mx-6 p-6">
        <div v-if="loading" class="loading-screen-centered-column py-20">
          <div class="loading-spinner-primary mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Loading boards...</p>
        </div>
        
        <div v-else-if="boards.length === 0" class="text-center py-20">
          <svg class="w-20 h-20 mx-auto mb-6 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="text-xl text-gray-600 dark:text-gray-400">No boards yet. Create your first board!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    
    <!-- Modals remain inline for now -->
    <div v-if="showCreateModal || editingBoard" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingBoard ? 'Edit Board' : 'Create Board' }}</h2>
        <form @submit.prevent="handleSaveBoard">
          <div class="form-group">
            <label>Board Name</label>
            <input v-model="boardForm.name" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="boardForm.description" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <GlassButton type="button" @click="closeModal" color="blue" size="md" variant="basic">Cancel</GlassButton>
            <GlassButton type="submit" color="purple" size="md" variant="shimmer">Save</GlassButton>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRequestsModal" class="modal-overlay" @click.self="closeRequestsModal">
      <div class="modal">
        <h2>Join Requests</h2>
        <div v-if="loadingRequests" class="loading-small">Loading...</div>
        <div v-else-if="joinRequests.length === 0" class="empty-requests">
          <p>No pending requests</p>
        </div>
        <div v-else class="requests-list scrollbar-hide">
          <div v-for="request in joinRequests" :key="request.id" class="request-item">
            <div class="request-user">
              <div class="user-avatar">{{ request.profiles?.full_name?.[0] || request.profiles?.email?.[0] || '?' }}</div>
              <div class="user-info">
                <div class="user-name">{{ request.profiles?.full_name || 'Unknown' }}</div>
                <div class="user-email">{{ request.profiles?.email }}</div>
              </div>
            </div>
            <div class="request-actions">
              <GlassButton @click="handleApprove(request.id)" color="green" size="sm" variant="shimmer">✓ Approve</GlassButton>
              <GlassButton @click="handleReject(request.id)" color="red" size="sm" variant="shimmer">✗ Reject</GlassButton>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <GlassButton @click="closeRequestsModal" color="blue" size="md" variant="basic">Close</GlassButton>
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped>
/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  width: 91.666667%;
  max-width: 32rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.dark .modal {
  background: rgba(17, 24, 39, 0.6);
  border-color: rgba(55, 65, 81, 0.4);
}

.modal h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
}

.dark .modal h2 {
  color: #f9fafb;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.dark .form-group label {
  color: #d1d5db;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #111827;
  transition: all 0.2s;
}

.dark .form-group input,
.dark .form-group textarea {
  border-color: #374151;
  background: #1f2937;
  color: #f9fafb;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px #6366f1;
  border-color: #6366f1;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Requests modal */
.requests-list {
  max-height: 24rem;
  overflow-y: auto;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark .request-item {
  border-bottom-color: #374151;
}

.request-item:last-child {
  border-bottom: none;
}

.request-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.dark .user-name {
  color: #f9fafb;
}

.user-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .user-email {
  color: #9ca3af;
}

.request-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-small {
  text-align: center;
  padding: 1.25rem;
  color: #6b7280;
}

.dark .loading-small {
  color: #9ca3af;
}

.empty-requests {
  text-align: center;
  padding: 2.5rem;
  color: #6b7280;
}

.dark .empty-requests {
  color: #9ca3af;
}
</style>
