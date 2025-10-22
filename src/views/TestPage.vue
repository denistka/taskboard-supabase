<template>
  <div class="test-page relative">
    <h1>WebSocket Test Page</h1>
    
    <!-- Connection Status -->
    <div class="status-section">
      <h2>Connection Status</h2>
      <p>Connected: {{ isConnected ? '✅' : '❌' }}</p>
      <p>Connecting: {{ isConnecting ? '🔄' : '⏹️' }}</p>
      <p>Error: {{ lastError || 'None' }}</p>
      <button @click="initializeConnection">Initialize Connection</button>
      <button @click="disconnect">Disconnect</button>
    </div>

    <!-- Authentication Section -->
    <div class="auth-section">
      <h2>Authentication</h2>
      <div v-if="!currentUser">
        <div class="auth-form">
          <h3>Sign Up</h3>
          <input v-model="signUpData.email" placeholder="Email" type="email" />
          <input v-model="signUpData.password" placeholder="Password" type="password" />
          <input v-model="signUpData.fullName" placeholder="Full Name" />
          <button @click="signUp">Sign Up</button>
        </div>
        
        <div class="auth-form">
          <h3>Sign In</h3>
          <input v-model="signInData.email" placeholder="Email" type="email" />
          <input v-model="signInData.password" placeholder="Password" type="password" />
          <button @click="signIn">Sign In</button>
        </div>
      </div>
      
      <div v-else>
        <p>Logged in as: {{ currentUser.email }}</p>
        <button @click="signOut">Sign Out</button>
      </div>
    </div>

    <!-- Boards Section -->
    <div class="boards-section">
      <h2>Boards</h2>
      <div class="board-actions">
        <input v-model="newBoardName" placeholder="Board Name" />
        <button @click="createBoard">Create Board</button>
        <button @click="listBoards">List Boards</button>
      </div>
      
      <div class="boards-list">
        <div v-for="board in boards" :key="board.id" class="board-item">
          <div>
            <strong>{{ board.name }}</strong>
            <span>ID: {{ board.id }}</span>
            <span>Created: {{ new Date(board.created_at).toLocaleDateString() }}</span>
          </div>
          <div class="board-actions">
            <input v-model="board.editName" :placeholder="board.name" />
            <button @click="updateBoard(board)">Update</button>
            <button @click="deleteBoard(board.id)">Delete</button>
            <button @click="selectBoard(board)">Select</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tasks Section -->
    <div class="tasks-section" v-if="selectedBoard">
      <h2>Tasks for: {{ selectedBoard.name }}</h2>
      <div class="task-actions">
        <input v-model="newTask.title" placeholder="Task Title" />
        <textarea v-model="newTask.description" placeholder="Task Description"></textarea>
        <select v-model="newTask.status">
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button @click="createTask">Create Task</button>
        <button @click="listTasks">List Tasks</button>
      </div>
      
      <div class="tasks-list">
        <div v-for="task in tasks" :key="task.id" class="task-item">
          <div>
            <strong>{{ task.title }}</strong>
            <p>{{ task.description }}</p>
            <span>Status: {{ task.status }}</span>
            <span>Position: {{ task.position }}</span>
            <span>Version: {{ task.version }}</span>
          </div>
          <div class="task-actions">
            <input v-model="task.editTitle" :placeholder="task.title" />
            <textarea v-model="task.editDescription" :placeholder="task.description"></textarea>
            <select v-model="task.editStatus">
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button @click="updateTask(task)">Update</button>
            <button @click="deleteTask(task.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Section -->
    <div class="log-section">
      <h2>Log</h2>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" :class="['log-entry', log.type]">
          <span class="timestamp">{{ log.timestamp }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
      <button @click="clearLogs">Clear Logs</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/api/ws'

// Reactive data
const isConnected = ref(false)
const isConnecting = ref(false)
const lastError = ref<string | null>(null)
const currentUser = ref<any>(null)
const currentToken = ref<string | null>(null)

// Auth data
const signUpData = ref({
  email: '',
  password: '',
  fullName: ''
})

const signInData = ref({
  email: '',
  password: ''
})

// Board data
const boards = ref<any[]>([])
const selectedBoard = ref<any>(null)
const newBoardName = ref('')

// Task data
const tasks = ref<any[]>([])
const newTask = ref({
  title: '',
  description: '',
  status: 'todo'
})

// Logs
const logs = ref<Array<{ timestamp: string; message: string; type: string }>>([])

// Helper functions
const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
  logs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  })
}

const updateConnectionStatus = () => {
  isConnected.value = api.isConnected
  lastError.value = api.lastError
}

// Connection management
const initializeConnection = async () => {
  try {
    addLog('Initializing WebSocket connection...', 'info')
    await api.initialize()
    updateConnectionStatus()
    addLog('WebSocket connection initialized', 'success')
  } catch (error) {
    addLog(`Connection error: ${error}`, 'error')
    updateConnectionStatus()
  }
}

const disconnect = () => {
  api.cleanup()
  updateConnectionStatus()
  addLog('WebSocket disconnected', 'info')
}

// Authentication functions
const signUp = async () => {
  try {
    addLog(`Signing up user: ${signUpData.value.email}`, 'info')
    const result = await api.signUp(signUpData.value)
    addLog(`Sign up successful: ${JSON.stringify(result)}`, 'success')
  } catch (error) {
    addLog(`Sign up error: ${error}`, 'error')
  }
}

const signIn = async () => {
  try {
    addLog(`Signing in user: ${signInData.value.email}`, 'info')
    const result = await api.signIn(signInData.value)
    
    if (result?.access_token) {
      currentToken.value = result.access_token
      currentUser.value = result.user
      addLog(`Sign in successful: ${result.user.email}`, 'success')
      
      // Reconnect with token
      await api.authenticate(result.access_token)
      updateConnectionStatus()
    }
  } catch (error) {
    addLog(`Sign in error: ${error}`, 'error')
  }
}

const signOut = () => {
  currentUser.value = null
  currentToken.value = null
  addLog('Signed out', 'info')
}

// Board functions
const createBoard = async () => {
  if (!newBoardName.value.trim()) {
    addLog('Board name is required', 'error')
    return
  }
  
  if (!currentUser.value?.id) {
    addLog('User not authenticated', 'error')
    return
  }
  
  try {
    addLog(`Creating board: ${newBoardName.value}`, 'info')
    const result = await api.createBoard({
      name: newBoardName.value,
      description: ''
    }, currentUser.value.id)
    
    if (result) {
      boards.value.push(result)
      newBoardName.value = ''
      addLog(`Board created: ${result.name}`, 'success')
    }
  } catch (error) {
    addLog(`Create board error: ${error}`, 'error')
  }
}

const listBoards = async () => {
  try {
    addLog('Fetching boards...', 'info')
    const result = await api.getUserBoard(currentUser.value?.id)
    
    if (result) {
      boards.value = [result] // getUserBoard returns a single board
      addLog(`Found board: ${result.name}`, 'success')
    }
  } catch (error) {
    addLog(`List boards error: ${error}`, 'error')
  }
}

const updateBoard = async (board: any) => {
  if (!board.editName?.trim()) {
    addLog('Board name is required for update', 'error')
    return
  }
  
  try {
    addLog(`Updating board: ${board.name}`, 'info')
    const result = await api.updateBoard(board.id, { name: board.editName })
    
    if (result) {
      const index = boards.value.findIndex(b => b.id === board.id)
      if (index !== -1) {
        boards.value[index] = result
      }
      addLog(`Board updated: ${result.name}`, 'success')
    }
  } catch (error) {
    addLog(`Update board error: ${error}`, 'error')
  }
}

const deleteBoard = async (boardId: string) => {
  try {
    addLog(`Deleting board: ${boardId}`, 'info')
    await api.deleteBoard(boardId)
    
    boards.value = boards.value.filter(b => b.id !== boardId)
    if (selectedBoard.value?.id === boardId) {
      selectedBoard.value = null
      tasks.value = []
    }
    addLog(`Board deleted: ${boardId}`, 'success')
  } catch (error) {
    addLog(`Delete board error: ${error}`, 'error')
  }
}

const selectBoard = (board: any) => {
  selectedBoard.value = board
  addLog(`Selected board: ${board.name}`, 'info')
}

// Task functions
const createTask = async () => {
  if (!selectedBoard.value || !newTask.value.title.trim()) {
    addLog('Selected board and task title are required', 'error')
    return
  }

  if (!currentUser.value?.id) {
    addLog('User not authenticated', 'error')
    return
  }

  try {
    addLog(`Creating task: ${newTask.value.title}`, 'info')
    const result = await api.createTask({
      board_id: selectedBoard.value.id,
      title: newTask.value.title,
      description: newTask.value.description,
      status: newTask.value.status,
      position: tasks.value.length
    }, currentUser.value.id)
    
    if (result) {
      tasks.value.push(result)
      newTask.value = { title: '', description: '', status: 'todo' }
      addLog(`Task created: ${result.title}`, 'success')
    }
  } catch (error) {
    addLog(`Create task error: ${error}`, 'error')
  }
}

const listTasks = async () => {
  if (!selectedBoard.value) {
    addLog('No board selected', 'error')
    return
  }
  
  try {
    addLog(`Fetching tasks for board: ${selectedBoard.value.name}`, 'info')
    const result = await api.getTasks(selectedBoard.value.id)
    
    if (result) {
      tasks.value = result
      addLog(`Found ${tasks.value.length} tasks`, 'success')
    }
  } catch (error) {
    addLog(`List tasks error: ${error}`, 'error')
  }
}

const updateTask = async (task: any) => {
  if (!task.editTitle?.trim()) {
    addLog('Task title is required for update', 'error')
    return
  }
  
  try {
    addLog(`Updating task: ${task.title}`, 'info')
    const result = await api.updateTask(task.id, {
      title: task.editTitle,
      description: task.editDescription,
      status: task.editStatus
    })
    
    if (result) {
      const index = tasks.value.findIndex(t => t.id === task.id)
      if (index !== -1) {
        tasks.value[index] = result
      }
      addLog(`Task updated: ${result.title}`, 'success')
    }
  } catch (error) {
    addLog(`Update task error: ${error}`, 'error')
  }
}

const deleteTask = async (taskId: string) => {
  try {
    addLog(`Deleting task: ${taskId}`, 'info')
    await api.deleteTask(taskId)
    
    tasks.value = tasks.value.filter(t => t.id !== taskId)
    addLog(`Task deleted: ${taskId}`, 'success')
  } catch (error) {
    addLog(`Delete task error: ${error}`, 'error')
  }
}

const clearLogs = () => {
  logs.value = []
}

// Lifecycle
onMounted(() => {
  updateConnectionStatus()
  addLog('Test page mounted', 'info')
})

onUnmounted(() => {
  // Don't cleanup the WebSocket connection here as it might be used by other components
  addLog('Test page unmounted', 'info')
})
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-top: 30px;
}

.status-section, .auth-section, .boards-section, .tasks-section, .log-section {
  background: #f9f9f9;
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.auth-form {
  margin: 15px 0;
  padding: 15px;
  background: white;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.auth-form h3 {
  margin-top: 0;
  color: #666;
}

input, textarea, select {
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

textarea {
  height: 60px;
  resize: vertical;
}

button {
  background: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.board-item, .task-item {
  background: white;
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
  border: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.board-actions, .task-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 200px;
}

.board-actions input, .task-actions input, .task-actions textarea, .task-actions select {
  width: 100%;
  margin: 2px 0;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.log-entry {
  padding: 5px;
  margin: 2px 0;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.log-entry.info {
  background: #e3f2fd;
}

.log-entry.success {
  background: #e8f5e8;
}

.log-entry.error {
  background: #ffebee;
  color: #c62828;
}

.timestamp {
  color: #666;
  margin-right: 10px;
}

.message {
  color: #333;
}
</style>
