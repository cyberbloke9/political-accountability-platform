'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreHorizontal,
  Flag,
  Edit,
  Trash2,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getThreadedComments,
  addComment,
  voteOnComment,
  editComment,
  deleteComment,
  flagComment,
  getDiscussionStats,
  formatCommentTime,
  type Comment,
  type TargetType,
  type DiscussionStats,
  type FlagReason
} from '@/lib/discussions'

interface DiscussionThreadProps {
  targetType: TargetType
  targetId: string
  title?: string
}

export function DiscussionThread({ targetType, targetId, title = 'Discussion' }: DiscussionThreadProps) {
  const { isAuthenticated, user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState<DiscussionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const [commentsResult, statsResult] = await Promise.all([
        getThreadedComments(targetType, targetId),
        getDiscussionStats(targetType, targetId)
      ])

      if (commentsResult.data) {
        setComments(commentsResult.data)
      }
      if (statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }, [targetType, targetId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    setSubmitting(true)
    const { data, error } = await addComment(targetType, targetId, newComment.trim())

    if (error) {
      toast.error(error)
    } else {
      toast.success('Comment added')
      setNewComment('')
      loadComments()
    }
    setSubmitting(false)
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {title}
            {stats && (
              <Badge variant="secondary" className="ml-2">
                {stats.total_comments} {stats.total_comments === 1 ? 'comment' : 'comments'}
              </Badge>
            )}
          </CardTitle>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {stats && stats.unique_participants > 0 && (
          <p className="text-sm text-muted-foreground">
            {stats.unique_participants} participant{stats.unique_participants !== 1 ? 's' : ''} in this discussion
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* New Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/2000 characters
                </span>
                <Button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post Comment
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                <a href="/auth/login" className="text-primary hover:underline">Sign in</a> to join the discussion
              </p>
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  targetType={targetType}
                  targetId={targetId}
                  onReload={loadComments}
                  isAuthenticated={isAuthenticated}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Single Comment Component
interface CommentItemProps {
  comment: Comment
  targetType: TargetType
  targetId: string
  onReload: () => void
  isAuthenticated: boolean
  currentUserId?: string
  depth?: number
}

function CommentItem({
  comment,
  targetType,
  targetId,
  onReload,
  isAuthenticated,
  currentUserId,
  depth = 0
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [voting, setVoting] = useState(false)
  const [showReplies, setShowReplies] = useState(depth < 2)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const isOwner = currentUserId === comment.user_id
  const netVotes = comment.upvotes - comment.downvotes

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast.error('Sign in to vote')
      return
    }

    setVoting(true)
    const { error } = await voteOnComment(comment.id, voteType)
    if (error) {
      toast.error(error)
    } else {
      onReload()
    }
    setVoting(false)
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSubmitting(true)
    const { error } = await addComment(targetType, targetId, replyContent.trim(), comment.id)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Reply added')
      setReplyContent('')
      setShowReplyForm(false)
      onReload()
    }
    setSubmitting(false)
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return

    setSubmitting(true)
    const { error } = await editComment(comment.id, editContent.trim())

    if (error) {
      toast.error(error)
    } else {
      toast.success('Comment updated')
      setEditing(false)
      onReload()
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    const { error } = await deleteComment(comment.id)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Comment deleted')
      onReload()
    }
  }

  const handleFlag = async (reason: FlagReason) => {
    const { error } = await flagComment(comment.id, reason)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Comment flagged for review')
    }
    setShowMenu(false)
  }

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-muted' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user_avatar ? (
            <img
              src={comment.user_avatar}
              alt={comment.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary/60" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.username}</span>
            <span className="text-xs text-muted-foreground">
              {formatCommentTime(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[60px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 ${comment.user_vote === 'up' ? 'text-green-600' : ''}`}
                onClick={() => handleVote('up')}
                disabled={voting}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <span className={`text-xs font-medium ${netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {netVotes}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 ${comment.user_vote === 'down' ? 'text-red-600' : ''}`}
                onClick={() => handleVote('down')}
                disabled={voting}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>

            {isAuthenticated && depth < 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {comment.reply_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </Button>
            )}

            {/* More menu */}
            <div className="relative ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  {isOwner && (
                    <>
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
                        onClick={() => { setEditing(true); setShowMenu(false) }}
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </>
                  )}
                  {!isOwner && isAuthenticated && (
                    <>
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
                        onClick={() => handleFlag('spam')}
                      >
                        <Flag className="h-3 w-3" /> Report Spam
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center gap-2"
                        onClick={() => handleFlag('misinformation')}
                      >
                        <AlertCircle className="h-3 w-3" /> Misinformation
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.username}...`}
                className="w-full min-h-[60px] p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                maxLength={2000}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!replyContent.trim() || submitting}>
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                  Reply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Nested Replies */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  targetType={targetType}
                  targetId={targetId}
                  onReload={onReload}
                  isAuthenticated={isAuthenticated}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact version for showing comment count
export function DiscussionCount({
  targetType,
  targetId
}: {
  targetType: TargetType
  targetId: string
}) {
  const [stats, setStats] = useState<DiscussionStats | null>(null)

  useEffect(() => {
    getDiscussionStats(targetType, targetId).then(({ data }) => {
      if (data) setStats(data)
    })
  }, [targetType, targetId])

  if (!stats || stats.total_comments === 0) return null

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <MessageSquare className="h-4 w-4" />
      <span>{stats.total_comments}</span>
    </div>
  )
}
