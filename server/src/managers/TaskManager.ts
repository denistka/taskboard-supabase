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

  async move(tasks: Array<{ id: string; status: TaskStatus; position: number; version: number }>): Promise<void> {
    const updates = tasks.map(t => ({
      id: t.id,
      status: t.status,
      position: t.position,
      version: t.version + 1,
      updated_at: new Date().toISOString()
    }))

    const { error } = await this.supabase
      .from('tasks')
      .upsert(updates)

    if (error) throw error
  }
}
