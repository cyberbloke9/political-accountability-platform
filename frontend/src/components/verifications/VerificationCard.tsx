'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import {
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { QualityIndicator } from '@/components/quality/QualityBadge'
import { ConfidenceLevel } from '@/lib/evidence-quality'

interface VerificationCardProps {
  verification: {
    id: string
    verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
    evidence_text: string
    evidence_urls?: string[]
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    upvotes: number
    downvotes: number
    trust_level?: 'admin' | 'trusted_community' | 'community' | 'untrusted'
    is_self_verification?: boolean
    quality_score?: number
    confidence_level?: ConfidenceLevel
    submitter?: {
      username: string
      citizen_score: number
    }
  }
  onVoteChange?: () => void
}

const verdictConfig = {
  fulfilled: {
    label: 'Fulfilled',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
  broken: {
    label: 'Broken',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  stalled: {
    label: 'Stalled',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-muted',
  },
}

const statusConfig = {
  pending: {
    label: 'Pending Review',
    className: 'bg-muted text-muted-foreground',
  },
  approved: {
    label: 'Approved',
    className: 'bg-success/10 text-success',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive',
  },
}

const trustLevelConfig = {
  admin: {
    label: 'Admin Verified',
    icon: Shield,
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    weight: '3.0x',
  },
  trusted_community: {
    label: 'Trusted',
    icon: Shield,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    weight: '2.0x',
  },
  community: {
    label: 'Community',
    icon: User,
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    weight: '1.0x',
  },
  untrusted: {
    label: 'New User',
    icon: ShieldAlert,
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    weight: '0.5x',
  },
}

export function VerificationCard({ verification, onVoteChange }: VerificationCardProps) {
  const { user } = useAuth()
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)
  const [upvotes, setUpvotes] = useState(verification.upvotes)
  const [downvotes, setDownvotes] = useState(verification.downvotes)
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const verdict = verdictConfig[verification.verdict]
  const status = statusConfig[verification.status]
  const VerdictIcon = verdict.icon

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast.error('You must be logged in to vote')
      return
    }

    if (hasVoted && userVote === voteType) {
      toast.error('You have already voted')
      return
    }

    setIsVoting(true)

    try {
      // Get user's database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (userError || !userData) {
        toast.error('Failed to fetch user data')
        setIsVoting(false)
        return
      }

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id, vote_type')
        .eq('verification_id', verification.id)
        .eq('user_id', userData.id)
        .single()

      if (existingVote) {
        // User already voted - update their vote
        if (existingVote.vote_type === voteType) {
          toast.error('You have already cast this vote')
          setIsVoting(false)
          return
        }

        // Update vote
        const { error: updateError } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id)

        if (updateError) throw updateError

        // Update local state
        if (existingVote.vote_type === 'upvote') {
          setUpvotes(prev => prev - 1)
          setDownvotes(prev => prev + 1)
        } else {
          setUpvotes(prev => prev + 1)
          setDownvotes(prev => prev - 1)
        }

        setUserVote(voteType)
        toast.success('Vote updated!')
      } else {
        // Insert new vote
        const { error: insertError } = await supabase
          .from('votes')
          .insert({
            verification_id: verification.id,
            user_id: userData.id,
            vote_type: voteType,
          })

        if (insertError) throw insertError

        // Update local state
        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1)
        } else {
          setDownvotes(prev => prev + 1)
        }

        setUserVote(voteType)
        setHasVoted(true)
        toast.success('Vote recorded!')
      }

      // Trigger reputation recalculation
      if (onVoteChange) {
        onVoteChange()
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to record vote')
    } finally {
      setIsVoting(false)
    }
  }

  const trustLevel = verification.trust_level ? trustLevelConfig[verification.trust_level] : null
  const TrustIcon = trustLevel?.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge className={verdict.className + ' border text-xs sm:text-sm'}>
              <VerdictIcon className="h-3 w-3 mr-1" />
              {verdict.label}
            </Badge>
            <Badge className={status.className + ' text-xs sm:text-sm'}>
              {status.label}
            </Badge>
            {trustLevel && TrustIcon && (
              <Badge className={trustLevel.className + ' border text-xs sm:text-sm'}>
                <TrustIcon className="h-3 w-3 mr-1" />
                {trustLevel.label} {trustLevel.weight}
              </Badge>
            )}
            {verification.is_self_verification && (
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 border text-xs sm:text-sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Self-Verified
              </Badge>
            )}
            {verification.quality_score !== undefined && verification.confidence_level && (
              <QualityIndicator
                qualityScore={verification.quality_score}
                confidenceLevel={verification.confidence_level}
              />
            )}
          </div>

          {verification.submitter && (
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate max-w-[150px]">{verification.submitter.username}</span>
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                Score: {verification.submitter.citizen_score}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Calendar className="h-3 w-3" />
          <span>
            Submitted {format(new Date(verification.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Evidence Text */}
        <div>
          <h4 className="font-medium text-sm mb-2">Evidence</h4>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {verification.evidence_text}
          </p>
        </div>

        {/* Evidence URLs */}
        {verification.evidence_urls && verification.evidence_urls.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Supporting Links
              </h4>
              <div className="space-y-2">
                {verification.evidence_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-primary hover:underline flex items-start gap-2 break-all"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Voting Section */}
        <Separator />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={userVote === 'upvote' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              className="gap-1 sm:gap-2 flex-1 sm:flex-initial"
            >
              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium text-xs sm:text-sm">{upvotes}</span>
            </Button>
            <Button
              variant={userVote === 'downvote' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              className="gap-1 sm:gap-2 flex-1 sm:flex-initial"
            >
              <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium text-xs sm:text-sm">{downvotes}</span>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center sm:text-right">
            {upvotes + downvotes} {upvotes + downvotes === 1 ? 'vote' : 'votes'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
