// ============================================
// Application Domain Types
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  aud: string
  confirmation_sent_at?: string
  recovery_sent_at?: string
  email_change_sent_at?: string
  new_email?: string
  invited_at?: string
  action_link?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  confirmed_at?: string
  email_change_confirm_status?: number
  banned_until?: string
  reauthentication_sent_at?: string
  reauthentication_confirm_status?: number
  is_sso_user?: boolean
  deleted_at?: string
  is_anonymous?: boolean
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
  user: User
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

// ============================================
// API Layer Types
// ============================================

export type RequestType = 
  | 'auth' 
  | 'db' 
  | 'presence' 
  | 'presence:all'
  | ['auth', 'presence'] 
  | ['auth', 'presence:all']
  | ['db', 'presence'] 
  | ['db', 'presence:all']

export interface SendRequestOptions {
  eventId: string
  type: RequestType
  token?: string | null
  payload?: Record<string, any>
}

