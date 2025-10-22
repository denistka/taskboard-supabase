// ============================================
// Application Domain Types
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Profile {
  id: string
  email: string
  full_name: string | null
}

export interface Task {
  id: string
  board_id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_to: string | null
  created_by: string
  position: number
  version: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Board {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface UserPresence {
  user_id: string
  board_id: string
  last_seen: string
  event_data: Record<string, any>
  profile?: Profile
}

// ============================================
// WebSocket Communication Types
// ============================================

export interface WSRequest<T = any> {
  type: string
  payload: T
}

export interface WSResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface WSNotification<T = any> {
  type: string
  data: T
}

// WebSocket Request Payloads
export interface AuthSignInPayload {
  email: string
  password: string
}

export interface AuthSignUpPayload {
  email: string
  password: string
  fullName?: string
}

export interface TaskCreatePayload {
  board_id: string
  title: string
  description?: string | null
  status?: TaskStatus
}

export interface TaskUpdatePayload {
  taskId: string
  boardId: string
  updates: Partial<Task>
  currentVersion: number
}

export interface TaskMovePayload {
  boardId: string
  tasks: Array<{
    id: string
    status: TaskStatus
    position: number
    version: number
  }>
}

export interface PresenceUpdatePayload {
  boardId: string
  eventData?: Record<string, any>
}

// WebSocket Response Types
export interface AuthResponse {
  user: any // User type from @supabase/supabase-js
  token: string
}

export interface TasksResponse {
  tasks: Task[]
}

export interface TaskResponse {
  task: Task
}

export interface BoardResponse {
  board: Board
}

export interface PresenceResponse {
  users: UserPresence[]
}

// WebSocket Notification Types
export type WSNotificationType =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'tasks:moved'
  | 'presence:updated'
  | 'presence:user_joined'
  | 'presence:user_left'
  | 'presence:user_editing'
  | 'user:joined'
  | 'user:left'

