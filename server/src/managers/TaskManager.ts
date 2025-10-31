import { BaseManager } from './BaseManager.js'
import type { Task, TaskStatus } from '../../../shared/types.js'

export class TaskManager extends BaseManager {
  async fetch(boardId: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`*, profiles:created_by(id, email, full_name, avatar_url)`)
      .eq('board_id', boardId)
      .order('position', { ascending: true })

    if (error) throw error
    return data || []
  }

  async search(boardId: string, query: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`*, profiles:created_by(id, email, full_name, avatar_url)`)
      .eq('board_id', boardId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('position', { ascending: true })

    if (error) throw error
    return data || []
  }

  async create(boardId: string, title: string, description: string | null, status: TaskStatus, userId: string): Promise<Task> {
    const { data: existingTasks } = await this.supabase
      .from('tasks')
      .select('position')
      .eq('board_id', boardId)
      .eq('status', status)
      .order('position', { ascending: false })
      .limit(1)

    const position = existingTasks?.[0]?.position ?? -1

    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        board_id: boardId,
        title,
        description,
        status,
        created_by: userId,
        position: position + 1,
        version: 1
      })
      .select(`*, profiles:created_by(id, email, full_name, avatar_url)`)
      .single()

    if (error) throw error
    return data
  }

  async update(taskId: string, updates: Partial<Task>, currentVersion: number): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        ...updates,
        version: currentVersion + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select(`*, profiles:created_by(id, email, full_name, avatar_url)`)
      .single()

    if (error) throw error
    return data
  }

  async delete(taskId: string): Promise<string> {
    const { data: task } = await this.supabase
      .from('tasks')
      .select('board_id')
      .eq('id', taskId)
      .single()

    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
    return task?.board_id || ''
  }

  async move(tasks: Array<{ id: string; board_id: string; status: TaskStatus; position: number; version: number }>): Promise<void> {
    // Fetch existing tasks to preserve all fields
    const taskIds = tasks.map(t => t.id)
    const { data: existingTasks, error: fetchError } = await this.supabase
      .from('tasks')
      .select('id, board_id, title, description, status, assigned_to, created_by, position, version, created_at, updated_at')
      .in('id', taskIds)

    if (fetchError) throw fetchError

    // Create a map of existing tasks for quick lookup
    const existingMap = new Map(existingTasks?.map((t: any) => [t.id, t]) || [])

    // Merge updates with existing task data
    const updates = tasks.map((t: { id: string; board_id: string; status: TaskStatus; position: number; version: number }) => {
      const existing: any = existingMap.get(t.id)
      if (!existing) {
        throw new Error(`Task ${t.id} not found`)
      }
      
      return {
        id: t.id,
        board_id: t.board_id,
        title: existing.title,
        description: existing.description,
        status: t.status,
        assigned_to: existing.assigned_to,
        created_by: existing.created_by,
        position: t.position,
        version: t.version + 1,
        created_at: existing.created_at,
        updated_at: new Date().toISOString()
      }
    })

    const { error } = await this.supabase
      .from('tasks')
      .upsert(updates, { onConflict: 'id' })

    if (error) throw error
  }
}
