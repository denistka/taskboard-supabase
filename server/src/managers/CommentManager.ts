import { BaseManager } from './BaseManager.js'
import type { TaskComment } from '../../../shared/types.js'

export class CommentManager extends BaseManager {
  private async enrichWithProfiles(comments: any[]): Promise<TaskComment[]> {
    if (comments.length === 0) return []

    // Get unique user IDs
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))]
    if (userIds.length === 0) {
      return comments.map(c => ({ ...c, profile: null }))
    }

    // Fetch profiles
    const { data: profiles } = await this.supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    // Merge profiles into comments
    return comments.map(comment => ({
      ...comment,
      profile: profileMap.get(comment.user_id) || null
    }))
  }

  async fetchByTask(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return this.enrichWithProfiles(data || [])
  }

  async create(taskId: string, userId: string, content: string): Promise<TaskComment> {
    const { data, error } = await this.supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        content
      })
      .select('*')
      .single()

    if (error) throw error
    const enriched = await this.enrichWithProfiles([data])
    return enriched[0]
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
      .select('*')
      .single()

    if (error) throw error
    const enriched = await this.enrichWithProfiles([data])
    return enriched[0]
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
