import { BaseManager } from './BaseManager.js'
import type { TaskComment } from '../../../shared/types.js'

export class CommentManager extends BaseManager {
  async fetchByTask(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .select(`*, profiles:user_id(id, email, full_name, avatar_url)`)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []).map((comment: any) => ({
      ...comment,
      profile: comment.profiles || null
    }))
  }

  async create(taskId: string, userId: string, content: string): Promise<TaskComment> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        content
      })
      .select(`*, profiles:user_id(id, email, full_name, avatar_url)`)
      .single()

    if (error) throw error
    return {
      ...data,
      profile: data.profiles || null
    }
  }

  async update(commentId: string, userId: string, content: string): Promise<TaskComment> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(`*, profiles:user_id(id, email, full_name, avatar_url)`)
      .single()

    if (error) throw error
    return {
      ...data,
      profile: data.profiles || null
    }
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) throw error
  }
}
