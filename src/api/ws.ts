/**
 * Simple API Provider
 * 
 * Easy-to-use methods that abstract the complex WebSocket API
 * Based on the server's template system
 */

import { wsAPI } from '@/lib/websocket'

// Types
interface Board {
  id: string
  name: string
  description: string
  created_by: string
  created_at: string
  updated_at: string
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  position: number
  board_id: string
  assigned_to: string | null
  created_by: string
  version: number
  created_at: string
  updated_at: string
  email?: string
  full_name?: string
}

interface Profile {
  id: string
  email: string
  full_name: string
  created_at: string
}

interface CreateBoardInput {
  name: string
  description: string
}

interface CreateTaskInput {
  board_id: string
  title: string
  description: string
  status: string
  position: number
  assigned_to?: string
}

interface UpdateBoardInput {
  name?: string
  description?: string
}

interface UpdateTaskInput {
  title?: string
  description?: string
  status?: string
  position?: number
  assigned_to?: string
}

interface MoveTaskInput {
  id: string
  status: string
  position: number
}

class WebSocketAPI {
  private currentToken: string | null = null

  /**
   * Initialize the API connection
   */
  async initialize(): Promise<void> {
    await wsAPI.initialize()
  }

  /**
   * Reconnect with authentication token
   */
  async authenticate(token: string): Promise<void> {
    this.currentToken = token
    await wsAPI.reconnectWithToken(token)
  }

  /**
   * Get current token
   */
  get token(): string | null {
    return this.currentToken
  }

  // ===== AUTHENTICATION OPERATIONS =====

  /**
   * Sign up a new user
   */
  async signUp(data: { email: string; password: string; fullName: string }): Promise<any> {
    return wsAPI.request('auth', 'signup', ['auth'], data)
  }

  /**
   * Sign in user
   */
  async signIn(data: { email: string; password: string }): Promise<any> {
    return wsAPI.request('auth', 'signin', ['auth'], data)
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<any> {
    return wsAPI.request('auth', 'get_user', ['auth'], { token: this.currentToken }, this.currentToken || undefined)
  }

  // ===== BOARD OPERATIONS =====

  /**
   * Get board by ID
   */
  async getBoard(boardId: string): Promise<Board> {
    return wsAPI.request('board', 'get_by_id', ['db'], { boardId })
  }

  /**
   * Get user's board (first one)
   */
  async getUserBoard(userId: string): Promise<Board> {
    return wsAPI.request('board', 'get_by_user', ['db'], { userId })
  }

  /**
   * Create a new board
   */
  async createBoard(input: CreateBoardInput, userId: string): Promise<Board> {
    const payload = {
      ...input,
      created_by: userId
    }
    return wsAPI.request('board', 'create', ['db'], payload, this.currentToken || undefined)
  }

  /**
   * Update board
   */
  async updateBoard(boardId: string, updates: UpdateBoardInput): Promise<Board> {
    return wsAPI.request('board', 'update', ['db'], { boardId, ...updates }, this.currentToken || undefined)
  }

  /**
   * Delete board
   */
  async deleteBoard(boardId: string): Promise<void> {
    return wsAPI.request('board', 'delete', ['db'], { boardId })
  }

  // ===== TASK OPERATIONS =====

  /**
   * Get all tasks for a board
   */
  async getTasks(boardId: string): Promise<Task[]> {
    return wsAPI.request('task', 'get_by_board', ['db'], { boardId })
  }

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput, userId: string): Promise<Task> {
    const payload = {
      ...input,
      created_by: userId,
      assigned_to: userId // Default to current user
    }
    return wsAPI.request('task', 'create', ['db'], payload, this.currentToken || undefined)
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task> {
    return wsAPI.request('task', 'update', ['db'], { taskId, ...updates })
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    return wsAPI.request('task', 'delete', ['db'], { taskId })
  }

  /**
   * Move task (change status/position)
   */
  async moveTask(moves: MoveTaskInput[]): Promise<Task[]> {
    return wsAPI.request('task', 'move', ['db'], { moves })
  }

  // ===== PROFILE OPERATIONS =====

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Profile> {
    return wsAPI.request('profile', 'get_by_id', ['db'], { userId })
  }

  /**
   * Create user profile
   */
  async createProfile(input: Omit<Profile, 'created_at'>): Promise<Profile> {
    return wsAPI.request('profile', 'create', ['db'], input)
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    return wsAPI.request('profile', 'update', ['db'], { userId, ...updates })
  }

  // ===== PRESENCE OPERATIONS =====

  /**
   * Update user presence
   */
  async updatePresence(data: any): Promise<void> {
    return wsAPI.request('presence', 'update', ['presence'], data)
  }

  /**
   * Get presence statistics
   */
  async getPresenceStats(): Promise<any> {
    return wsAPI.request('presence', 'get_stats', ['presence'], {})
  }

  // ===== NOTIFICATION SUBSCRIPTIONS =====

  /**
   * Subscribe to board updates
   */
  onBoardUpdate(callback: (data: any) => void): () => void {
    return wsAPI.on('board_update', callback)
  }

  /**
   * Subscribe to task updates
   */
  onTaskUpdate(callback: (data: any) => void): () => void {
    return wsAPI.on('task_update', callback)
  }

  /**
   * Subscribe to presence updates
   */
  onPresenceUpdate(callback: (data: any) => void): () => void {
    return wsAPI.on('presence_update', callback)
  }

  /**
   * Subscribe to user joins/leaves
   */
  onUserActivity(callback: (data: any) => void): () => void {
    return wsAPI.on('user_activity', callback)
  }

  // ===== UTILITY METHODS =====

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return wsAPI.isConnected
  }

  /**
   * Get last error
   */
  get lastError(): string | null {
    return wsAPI.lastError
  }

  /**
   * Cleanup connections
   */
  cleanup(): void {
    wsAPI.cleanup()
  }
}

// Export singleton instance
export const api = new WebSocketAPI()

// Export types for use in components
export type {
  Board,
  Task,
  Profile,
  CreateBoardInput,
  CreateTaskInput,
  UpdateBoardInput,
  UpdateTaskInput,
  MoveTaskInput
}
