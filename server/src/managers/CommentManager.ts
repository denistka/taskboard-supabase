import { BaseManager } from './BaseManager.js'
import type { Comment } from '../../../shared/types.js'

export class CommentManager extends BaseManager {
  private async enrichWithProfiles(comments: any[]): Promise<Comment[]> {
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

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    // Merge profiles into comments
    return comments.map(comment => ({
      ...comment,
      profile: profileMap.get(comment.user_id) || null
    }))
  }

  async fetchByItem(itemId: string, entityType: string): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .from('comments')
      .select('*')
      .eq('entity_id', itemId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: true })

    if (error) throw error
    return this.enrichWithProfiles(data || [])
  }

  async create(itemId: string, userId: string, content: string, entityType: string): Promise<Comment> {
    const { data, error } = await this.supabase
      .from('comments')
      .insert({
        entity_id: itemId,
        entity_type: entityType,
        user_id: userId,
        content
      })
      .select('*')
      .single()

    if (error) throw error
    const enriched = await this.enrichWithProfiles([data])
    return enriched[0]
  }

  async update(commentId: string, userId: string, content: string): Promise<Comment> {
    const { data, error } = await this.supabase
      .from('comments')
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
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)

    if (error) throw error
  }
}
