<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBoards } from '../../composables/useBoards'
import { useToast } from '../../composables/useNotification'
import PageLayout from '../wrappers/PageLayout.vue'
import BoardCard from './boards/BoardCard.vue'
import CreateBoardModal from './boards/CreateBoardModal.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { 
  boards, 
  isBoardCreating,
  list, 
  create, 
  update, 
  remove, 
  requestJoin, 
  leave, 
  approveJoin, 
  rejectJoin, 
  listRequests,
  setIsBoardCreating,
} = useBoards()

// State
const loading = ref(true)

// Join Requests per Board (for card overlays)
const boardRequests = ref<Record<string, any[]>>({})
const boardRequestsLoading = ref<Record<string, boolean>>({})
const boardRequestsOpen = ref<Record<string, boolean>>({})

// Watch for create action from header
watch(() => route.query.action, (action) => {
  if (action === 'create') {
    setIsBoardCreating(true)
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
    setIsBoardCreating(false)
  } catch (err: any) {
    toast.error(err.message || 'Failed to create board')
  }
}

// Handle board update from card inline editing
const handleBoardUpdate = async (boardId: string, data: { name: string; description: string }) => {
  try {
    await update(boardId, data)
    toast.success('Board updated successfully')
  } catch (err: any) {
    toast.error(err.message || 'Failed to update board')
  }
}

const deleteBoard = async (boardId: string) => {
  try {
    await remove(boardId)
    toast.success('Board deleted successfully')
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete board')
  }
}

const leaveBoard = async (boardId: string) => {
  try {
    await leave(boardId)
    toast.success('Left board successfully')
  } catch (err: any) {
    toast.error(err.message || 'Failed to leave board')
  }
}

const joinBoard = async (boardId: string) => {
  try {
    await requestJoin(boardId)
    toast.success('Join request sent! Wait for owner approval.')
  } catch (err: any) {
    toast.error(err.message || 'Failed to send join request')
  }
}

// Join requests handlers (for card overlay)
const handleLoadRequests = async (boardId: string) => {
  boardRequestsLoading.value[boardId] = true
  
  try {
    const requests = await listRequests(boardId)
    boardRequests.value[boardId] = requests
    boardRequestsOpen.value[boardId] = true
  } catch (err: any) {
    toast.error(err.message || 'Failed to load requests')
  } finally {
    boardRequestsLoading.value[boardId] = false
  }
}

const handleApproveRequestInCard = async (requestId: string) => {
  try {
    await approveJoin(requestId)
    
    // Remove from all board request lists
    Object.keys(boardRequests.value).forEach(boardId => {
      boardRequests.value[boardId] = boardRequests.value[boardId].filter(r => r.id !== requestId)
      if (boardRequests.value[boardId].length === 0) {
        boardRequestsOpen.value[boardId] = false
      }
    })
    
    toast.success('Request approved')
  } catch (err: any) {
    toast.error(err.message || 'Failed to approve request')
  }
}

const handleRejectRequestInCard = async (requestId: string) => {
  try {
    await rejectJoin(requestId)
    
    // Remove from all board request lists
    Object.keys(boardRequests.value).forEach(boardId => {
      boardRequests.value[boardId] = boardRequests.value[boardId].filter(r => r.id !== requestId)
      if (boardRequests.value[boardId].length === 0) {
        boardRequestsOpen.value[boardId] = false
      }
    })
    
    toast.success('Request rejected')
  } catch (err: any) {
    toast.error(err.message || 'Failed to reject request')
  }
}

</script>

<template>
  <PageLayout>
    <!-- Main Content -->
    <template #content>
      <div v-if="!loading" class="w-full p-11">
        <!-- Boards Grid -->
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <!-- Existing Boards -->
            <BoardCard
              v-for="board in boards"
              :key="board.id"
              :board="board"
              :joinRequests="boardRequests[board.id] || []"
              :loadingRequests="boardRequestsLoading[board.id] || false"
              @open="openBoard"
              @delete="deleteBoard"
              @leave="leaveBoard"
              @join="joinBoard"
              @update="handleBoardUpdate"
              @loadRequests="handleLoadRequests"
              @approveRequest="handleApproveRequestInCard"
              @rejectRequest="handleRejectRequestInCard"
            />
          </div>
        </div>
      </div>
    </template>
    
  </PageLayout>

  <!-- Create Board Modal -->
  <CreateBoardModal
    v-model="isBoardCreating"
    @create="handleCreateBoard"
  />
</template>

