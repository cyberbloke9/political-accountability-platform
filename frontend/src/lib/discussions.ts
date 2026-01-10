import { supabase } from './supabase'

export type TargetType = 'promise' | 'verification' | 'politician'
export type VoteType = 'up' | 'down'
export type FlagReason = 'spam' | 'harassment' | 'misinformation' | 'off_topic' | 'other'

export interface Comment {
  id: string
  content: string
  parent_id: string | null
  thread_depth: number
  user_id: string
  username: string
  user_avatar: string | null
  upvotes: number
  downvotes: number
  reply_count: number
  is_edited: boolean
  created_at: string
  user_vote: VoteType | null
  replies?: Comment[]
}

export interface DiscussionStats {
  total_comments: number
  top_level_comments: number
  unique_participants: number
  last_comment_at: string | null
}

/**
 * Add a new comment
 */
export async function addComment(
  targetType: TargetType,
  targetId: string,
  content: string,
  parentId?: string
): Promise<{ data: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_comment', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_content: content,
      p_parent_id: parentId || null
    })

    if (error) {
      console.error('Error adding comment:', error)
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    console.error('Error adding comment:', error)
    return { data: null, error: 'Failed to add comment' }
  }
}

/**
 * Get comments for a target
 */
export async function getComments(
  targetType: TargetType,
  targetId: string,
  parentId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ data: Comment[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_comments', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_parent_id: parentId || null,
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      console.error('Error fetching comments:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Comment[] }
  } catch (error) {
    console.error('Error fetching comments:', error)
    return { data: null, error: 'Failed to fetch comments' }
  }
}

/**
 * Get threaded comments (with nested replies)
 */
export async function getThreadedComments(
  targetType: TargetType,
  targetId: string,
  maxDepth: number = 3
): Promise<{ data: Comment[] | null; error?: string }> {
  try {
    // Get top-level comments
    const { data: topLevel, error } = await getComments(targetType, targetId, undefined, 50)

    if (error || !topLevel) {
      return { data: null, error }
    }

    // Load replies for each comment (up to maxDepth)
    const loadReplies = async (comments: Comment[], depth: number): Promise<Comment[]> => {
      if (depth >= maxDepth) return comments

      return Promise.all(
        comments.map(async (comment) => {
          if (comment.reply_count > 0) {
            const { data: replies } = await getComments(targetType, targetId, comment.id, 10)
            if (replies && replies.length > 0) {
              comment.replies = await loadReplies(replies, depth + 1)
            }
          }
          return comment
        })
      )
    }

    const threaded = await loadReplies(topLevel, 0)
    return { data: threaded }
  } catch (error) {
    console.error('Error fetching threaded comments:', error)
    return { data: null, error: 'Failed to fetch comments' }
  }
}

/**
 * Vote on a comment
 */
export async function voteOnComment(
  commentId: string,
  voteType: VoteType
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('vote_on_comment', {
      p_comment_id: commentId,
      p_vote_type: voteType
    })

    if (error) {
      console.error('Error voting on comment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error voting on comment:', error)
    return { success: false, error: 'Failed to vote' }
  }
}

/**
 * Edit a comment
 */
export async function editComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('edit_comment', {
      p_comment_id: commentId,
      p_content: content
    })

    if (error) {
      console.error('Error editing comment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error editing comment:', error)
    return { success: false, error: 'Failed to edit comment' }
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('delete_comment', {
      p_comment_id: commentId
    })

    if (error) {
      console.error('Error deleting comment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting comment:', error)
    return { success: false, error: 'Failed to delete comment' }
  }
}

/**
 * Flag a comment
 */
export async function flagComment(
  commentId: string,
  reason: FlagReason,
  details?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('flag_comment', {
      p_comment_id: commentId,
      p_reason: reason,
      p_details: details || null
    })

    if (error) {
      console.error('Error flagging comment:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error flagging comment:', error)
    return { success: false, error: 'Failed to flag comment' }
  }
}

/**
 * Get discussion stats for a target
 */
export async function getDiscussionStats(
  targetType: TargetType,
  targetId: string
): Promise<{ data: DiscussionStats | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('discussion_stats')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching discussion stats:', error)
      return { data: null, error: error.message }
    }

    return {
      data: data || {
        total_comments: 0,
        top_level_comments: 0,
        unique_participants: 0,
        last_comment_at: null
      }
    }
  } catch (error) {
    console.error('Error fetching discussion stats:', error)
    return { data: null, error: 'Failed to fetch stats' }
  }
}

/**
 * Format relative time for comments
 */
export function formatCommentTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
