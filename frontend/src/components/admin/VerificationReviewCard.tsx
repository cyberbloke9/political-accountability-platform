'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThumbsUp, ThumbsDown, ExternalLink, User, Calendar, Award, Shield, ShieldAlert, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface VerificationReviewCardProps {
  verification: {
    id: string
    evidence_text: string
    evidence_urls?: string[]
    verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
    status: 'pending' | 'approved' | 'rejected'
    upvotes: number
    downvotes: number
    created_at: string
    trust_level?: 'admin' | 'trusted_community' | 'community' | 'untrusted'
    is_self_verification?: boolean
    verification_weight?: number
    promise: {
      id: string
      politician_name: string
      promise_text: string
    }
    submitter: {
      id: string
      username: string
      citizen_score: number
    }
  }
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}

const verdictConfig = {
  fulfilled: { label: 'Fulfilled', color: 'bg-green-500' },
  broken: { label: 'Broken', color: 'bg-red-500' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500' },
  stalled: { label: 'Stalled', color: 'bg-yellow-500' }
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-600' },
  approved: { label: 'Approved', color: 'bg-green-600' },
  rejected: { label: 'Rejected', color: 'bg-red-600' }
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

export function VerificationReviewCard({
  verification,
  onApprove,
  onReject
}: VerificationReviewCardProps) {
  const verdict = verdictConfig[verification.verdict]
  const status = statusConfig[verification.status]
  const voteRatio = verification.upvotes + verification.downvotes > 0
    ? Math.round((verification.upvotes / (verification.upvotes + verification.downvotes)) * 100)
    : 0

  const trustLevel = verification.trust_level ? trustLevelConfig[verification.trust_level] : null
  const TrustIcon = trustLevel?.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Show status badge (Pending/Approved/Rejected) */}
              <Badge className={status.color + ' text-white text-xs sm:text-sm'}>
                {status.label}
              </Badge>
              {/* Show verdict badge (Fulfilled/Broken/etc) */}
              <Badge variant="outline" className="text-xs sm:text-sm">
                Claim: {verdict.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {voteRatio}% ({verification.upvotes}/{verification.downvotes})
              </Badge>
              {/* Trust level badge */}
              {trustLevel && TrustIcon && (
                <Badge className={trustLevel.className + ' border text-xs sm:text-sm'}>
                  <TrustIcon className="h-3 w-3 mr-1" />
                  {trustLevel.label} {trustLevel.weight}
                </Badge>
              )}
              {/* Self-verification warning */}
              {verification.is_self_verification && (
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 border text-xs sm:text-sm">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Self-Verified
                </Badge>
              )}
            </div>
            <CardTitle className="text-base sm:text-lg line-clamp-2 mb-2">
              {verification.promise.politician_name}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              Promise: {verification.promise.promise_text}
            </p>
          </div>
          <Link href={`/promises/${verification.promise.id}`} target="_blank" className="self-start">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Evidence */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Evidence</h4>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {verification.evidence_text}
          </p>
          {verification.evidence_urls && verification.evidence_urls.length > 0 && (
            <div className="mt-2 space-y-1">
              {verification.evidence_urls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View source {verification.evidence_urls!.length > 1 && `#${index + 1}`} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Submitter Info */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{verification.submitter.username}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-3 w-3" />
                <span>{verification.submitter.citizen_score} points</span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(verification.created_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Voting Stats */}
        <div className="flex flex-wrap gap-3 sm:gap-4 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-full">
              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </div>
            <span className="font-semibold">{verification.upvotes}</span>
            <span className="text-muted-foreground hidden sm:inline">upvotes</span>
            <span className="text-muted-foreground sm:hidden">up</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <div className="bg-red-100 p-1.5 sm:p-2 rounded-full">
              <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </div>
            <span className="font-semibold">{verification.downvotes}</span>
            <span className="text-muted-foreground hidden sm:inline">downvotes</span>
            <span className="text-muted-foreground sm:hidden">down</span>
          </div>
        </div>

        {/* Action Buttons */}
        {(onApprove || onReject) && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {onApprove && (
              <Button
                onClick={() => onApprove(verification.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 w-full"
              >
                Approve
              </Button>
            )}
            {onReject && (
              <Button
                onClick={() => onReject(verification.id)}
                variant="destructive"
                className="flex-1 w-full"
              >
                Reject
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
