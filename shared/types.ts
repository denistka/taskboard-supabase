export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface ProfileStats {
  ownedBoards: number
  joinedBoards: number
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
  owner_id: string
  created_at: string
  updated_at: string
}

export type BoardRole = 'owner' | 'member'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface BoardMember {
  board_id: string
  user_id: string
  role: BoardRole
  joined_at: string
}

export interface JoinRequest {
  id: string
  board_id: string
  user_id: string
  status: JoinRequestStatus
  created_at: string
  updated_at: string
}

export interface BoardWithRole extends Board {
  role: BoardRole | null  // null if user is not a member
  pending_requests?: number  // number of pending requests (for owners)
  has_pending_request?: boolean  // true if current user has pending request to this board
}

export interface AppPresence {
  user_id: string
  last_seen: string
  last_activity: string
  is_active: boolean
  event_data: Record<string, any>
  profile?: Profile
}

export interface BoardPresence {
  user_id: string
  board_id: string
  last_seen: string
  last_activity: string
  is_active: boolean
  event_data: Record<string, any>
  profile?: Profile
}

export interface Presence {
  user_id: string
  context: string
  context_id: string | null
  last_seen: string
  last_activity: string
  is_active: boolean
  event_data: Record<string, any>
  profile?: Profile
}

export type UserPresence = BoardPresence

export interface WSMessage<T = any> {
  type: string
  payload: T
  token?: string
}

export interface WSResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}
