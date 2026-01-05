'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { followTarget, unfollowTarget, isFollowing, getFollowerCount, type FollowType } from '@/lib/follows'
import { useToast } from '@/hooks/use-toast'

interface FollowButtonProps {
  targetType: FollowType
  targetId: string
  targetName?: string
  showCount?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function FollowButton({
  targetType,
  targetId,
  targetName,
  showCount = false,
  variant = 'outline',
  size = 'default',
  className = ''
}: FollowButtonProps) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    async function checkFollowStatus() {
      setLoading(true)
      try {
        const [isFollowingResult, count] = await Promise.all([
          isAuthenticated ? isFollowing(targetType, targetId) : Promise.resolve(false),
          showCount ? getFollowerCount(targetType, targetId) : Promise.resolve(0)
        ])
        setFollowing(isFollowingResult)
        setFollowerCount(count)
      } catch (error) {
        console.error('Error checking follow status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkFollowStatus()
  }, [targetType, targetId, isAuthenticated, showCount])

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to follow ' + (targetName || targetType + 's'),
        variant: 'destructive'
      })
      return
    }

    setActionLoading(true)
    try {
      if (following) {
        const result = await unfollowTarget(targetType, targetId)
        if (result.success) {
          setFollowing(false)
          setFollowerCount(prev => Math.max(0, prev - 1))
          toast({
            title: 'Unfollowed',
            description: `You will no longer receive updates about ${targetName || 'this ' + targetType}`
          })
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to unfollow',
            variant: 'destructive'
          })
        }
      } else {
        const result = await followTarget(targetType, targetId)
        if (result.success) {
          setFollowing(true)
          setFollowerCount(prev => prev + 1)
          toast({
            title: 'Following!',
            description: `You'll receive updates about ${targetName || 'this ' + targetType}`
          })
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to follow',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  const Icon = following ? BellOff : Bell
  const label = following ? 'Following' : 'Follow'

  return (
    <Button
      variant={following ? 'default' : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={actionLoading}
      className={`${className} ${following ? 'bg-primary' : ''}`}
    >
      {actionLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Icon className="h-4 w-4 mr-2" />
          {label}
          {showCount && followerCount > 0 && (
            <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {followerCount}
            </span>
          )}
        </>
      )}
    </Button>
  )
}

// Compact version for lists
export function FollowButtonCompact({
  targetType,
  targetId,
  className = ''
}: {
  targetType: FollowType
  targetId: string
  className?: string
}) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    async function checkFollowStatus() {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }
      try {
        const result = await isFollowing(targetType, targetId)
        setFollowing(result)
      } catch (error) {
        console.error('Error checking follow status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkFollowStatus()
  }, [targetType, targetId, isAuthenticated])

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to follow',
        variant: 'destructive'
      })
      return
    }

    setActionLoading(true)
    try {
      if (following) {
        const result = await unfollowTarget(targetType, targetId)
        if (result.success) {
          setFollowing(false)
        }
      } else {
        const result = await followTarget(targetType, targetId)
        if (result.success) {
          setFollowing(true)
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFollow}
      disabled={actionLoading}
      className={className}
      title={following ? 'Unfollow' : 'Follow'}
    >
      {actionLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <Bell className="h-4 w-4 text-primary fill-primary" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
    </Button>
  )
}
