import { BaseManager } from './BaseManager.js'
import type { Board, BoardWithRole, BoardMember, JoinRequest } from '../../../shared/types.js'

export class BoardManager extends BaseManager {
  // Create new board
  async create(userId: string, name: string, description?: string): Promise<Board> {
    const { data, error } = await this.supabase
      .from('boards')
      .insert({ name, description, owner_id: userId })
      .select()
      .single()

    if (error) throw error

    // Auto-add creator as owner member
    await this.supabase.from('board_members').insert({
      board_id: data.id,
      user_id: userId,
      role: 'owner'
    })

    return data
  }

  // List ALL boards with user's role (if any)
  async listUserBoards(userId: string): Promise<BoardWithRole[]> {
    // Get all boards
    const { data: allBoards, error: boardsError } = await this.supabase
      .from('boards')
      .select('id, name, description, owner_id, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (boardsError) throw boardsError

    // Get user's memberships
    const { data: memberships, error: membershipsError } = await this.supabase
      .from('board_members')
      .select('board_id, role')
      .eq('user_id', userId)

    if (membershipsError) throw membershipsError

    // Merge boards with roles
    const membershipMap = new Map(memberships?.map(m => [m.board_id, m.role]) || [])
    
    const boards: BoardWithRole[] = allBoards.map(board => ({
      ...board,
      role: membershipMap.get(board.id) || null
    }))

    // Get user's pending join requests
    const { data: userRequests } = await this.supabase
      .from('join_requests')
      .select('board_id')
      .eq('user_id', userId)
      .eq('status', 'pending')
    
    const userRequestsMap = new Set(userRequests?.map(r => r.board_id) || [])

    // Add pending request counts for owners and check user's requests
    for (const board of boards) {
      // Add count for owners
      if (board.role === 'owner') {
        const { count } = await this.supabase
          .from('join_requests')
          .select('*', { count: 'exact', head: true })
          .eq('board_id', board.id)
          .eq('status', 'pending')
        board.pending_requests = count || 0
      }
      // Check if user has pending request to this board
      board.has_pending_request = userRequestsMap.has(board.id)
    }

    return boards
  }

  // Update board
  async update(boardId: string, userId: string, updates: Partial<Pick<Board, 'name' | 'description'>>): Promise<Board> {
    // Check ownership
    const { data: board } = await this.supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single()

    if (board?.owner_id !== userId) throw new Error('Only owner can update board')

    const { data, error } = await this.supabase
      .from('boards')
      .update(updates)
      .eq('id', boardId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete board
  async delete(boardId: string, userId: string): Promise<void> {
    const { data: board } = await this.supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single()

    if (board?.owner_id !== userId) throw new Error('Only owner can delete board')

    const { error } = await this.supabase
      .from('boards')
      .delete()
      .eq('id', boardId)

    if (error) throw error
  }

  // Request to join board
  async requestJoin(boardId: string, userId: string): Promise<JoinRequest> {
    // Check if already member
    const { data: existing } = await this.supabase
      .from('board_members')
      .select('*')
      .eq('board_id', boardId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) throw new Error('Already a member')

    // Check if request exists
    const { data: existingReq } = await this.supabase
      .from('join_requests')
      .select('*')
      .eq('board_id', boardId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingReq) throw new Error('Join request already pending')

    const { data, error } = await this.supabase
      .from('join_requests')
      .insert({ board_id: boardId, user_id: userId, status: 'pending' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Approve join request
  async approveJoin(requestId: string, ownerId: string): Promise<void> {
    const { data: request } = await this.supabase
      .from('join_requests')
      .select('*, boards!inner(owner_id)')
      .eq('id', requestId)
      .single()

    if ((request as any).boards.owner_id !== ownerId) throw new Error('Only owner can approve')

    // Add as member
    await this.supabase.from('board_members').insert({
      board_id: request!.board_id,
      user_id: request!.user_id,
      role: 'member'
    })

    // Update request status
    await this.supabase
      .from('join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
  }

  // Reject join request
  async rejectJoin(requestId: string, ownerId: string): Promise<void> {
    const { data: request } = await this.supabase
      .from('join_requests')
      .select('*, boards!inner(owner_id)')
      .eq('id', requestId)
      .single()

    if ((request as any).boards.owner_id !== ownerId) throw new Error('Only owner can reject')

    await this.supabase
      .from('join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
  }

  // List pending requests for board
  async listJoinRequests(boardId: string, ownerId: string) {
    const { data: board } = await this.supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single()

    if (board?.owner_id !== ownerId) throw new Error('Only owner can view requests')

    // Get requests
    const { data: requests, error: requestsError } = await this.supabase
      .from('join_requests')
      .select('*')
      .eq('board_id', boardId)
      .eq('status', 'pending')

    if (requestsError) throw requestsError
    if (!requests || requests.length === 0) return []

    // Get user profiles for all requests
    const userIds = requests.map(r => r.user_id)
    const { data: profiles, error: profilesError } = await this.supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds)

    if (profilesError) throw profilesError

    // Merge profiles into requests
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    return requests.map(request => ({
      ...request,
      profiles: profileMap.get(request.user_id)
    }))
  }

  // Leave board (only for members, not owners)
  async leave(boardId: string, userId: string): Promise<void> {
    // Check if user is owner
    const { data: board } = await this.supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single()

    if (board?.owner_id === userId) throw new Error('Owner cannot leave board. Delete it instead.')

    // Remove membership
    const { error } = await this.supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', userId)

    if (error) throw error
  }
}
