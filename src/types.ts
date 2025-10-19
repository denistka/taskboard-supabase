export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          board_id: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'done'
          assigned_to: string | null
          created_by: string
          position: number
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          assigned_to?: string | null
          created_by: string
          position?: number
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          assigned_to?: string | null
          created_by?: string
          position?: number
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_presence: {
        Row: {
          id: string
          user_id: string
          board_id: string
          last_seen: string
          is_editing: boolean
          editing_task_id: string | null
          editing_fields: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          board_id: string
          last_seen?: string
          is_editing?: boolean
          editing_task_id?: string | null
          editing_fields?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          board_id?: string
          last_seen?: string
          is_editing?: boolean
          editing_task_id?: string | null
          editing_fields?: string[] | null
        }
      }
    }
  }
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

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
  profiles?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
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
  id: string
  user_id: string
  board_id: string
  last_seen: string
  is_editing: boolean
  editing_task_id: string | null
  editing_fields: string[] | null
  profile?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

