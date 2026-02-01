'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  PotentialCandidate,
  formatCandidacyStatus,
  getCandidacyStatusColor,
  formatWinRate,
  getWinRateColor,
  formatEligiblePositions,
  getSocialMediaLinks
} from '@/lib/candidates'
import {
  User,
  MapPin,
  Building,
  Briefcase,
  Vote,
  Award,
  TrendingUp,
  ChevronRight,
  Calendar,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  ExternalLink
} from 'lucide-react'

interface PotentialCandidateCardProps {
  candidate: PotentialCandidate
  showDetails?: boolean
  compact?: boolean
}

export function PotentialCandidateCard({
  candidate,
  showDetails = true,
  compact = false
}: PotentialCandidateCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const socialLinks = getSocialMediaLinks(candidate.social_media)

  if (compact) {
    return (
      <Link
        href={candidate.politician_id ? `/politicians/${candidate.politician_id}` : '#'}
        className="block"
      >
        <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={candidate.photo_url || undefined} alt={candidate.name} />
            <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{candidate.name}</p>
            <p className="text-xs text-muted-foreground">
              {candidate.party_name || candidate.party_short_name || 'Independent'}
            </p>
          </div>
          <Badge className={cn('text-xs', getCandidacyStatusColor(candidate.candidacy_status))}>
            {formatCandidacyStatus(candidate.candidacy_status)}
          </Badge>
        </div>
      </Link>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={candidate.photo_url || undefined} alt={candidate.name} />
            <AvatarFallback className="text-lg">{getInitials(candidate.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">{candidate.name}</CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building className="h-3 w-3" />
                  {candidate.party_name || candidate.party_short_name || 'Independent'}
                </p>
              </div>
              <Badge className={getCandidacyStatusColor(candidate.candidacy_status)}>
                {formatCandidacyStatus(candidate.candidacy_status)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Position */}
        {candidate.current_position && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{candidate.current_position}</span>
            {candidate.current_constituency && (
              <span className="text-muted-foreground">({candidate.current_constituency})</span>
            )}
          </div>
        )}

        {/* Location */}
        {candidate.state_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{candidate.state_name}</span>
            {candidate.home_district && <span>• {candidate.home_district}</span>}
          </div>
        )}

        {/* Eligible Positions */}
        {candidate.eligible_positions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Can run for:</p>
            <div className="flex flex-wrap gap-1">
              {candidate.eligible_positions.slice(0, 4).map((position) => (
                <Badge key={position} variant="outline" className="text-xs">
                  {position}
                </Badge>
              ))}
              {candidate.eligible_positions.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{candidate.eligible_positions.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Election Experience */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {candidate.previous_elections_contested > 0 && (
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Elections</p>
                <p className="font-medium">
                  {candidate.previous_elections_won}/{candidate.previous_elections_contested} won
                </p>
              </div>
            </div>
          )}
          {candidate.win_rate !== null && candidate.win_rate > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Win Rate</p>
                <p className={cn('font-medium', getWinRateColor(candidate.win_rate))}>
                  {formatWinRate(candidate.win_rate)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Announced for election */}
        {candidate.announced_for_election && (
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
            <p className="text-sm">
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Announced for:
              </span>{' '}
              <span className="text-purple-700 dark:text-purple-300">
                {candidate.announced_for_election}
              </span>
            </p>
            {candidate.announcement_date && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Announced on {formatDate(candidate.announcement_date)}
              </p>
            )}
          </div>
        )}

        {/* Social Media Links */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-2">
            {socialLinks.map((link) => {
              const Icon = {
                Twitter,
                Facebook,
                Instagram,
                Youtube,
                Linkedin
              }[link.icon] || ExternalLink

              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={link.platform}
                >
                  <Icon className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        )}

        {/* View Details Button */}
        {showDetails && candidate.politician_id && (
          <Link href={`/politicians/${candidate.politician_id}`}>
            <Button variant="outline" className="w-full">
              View Profile
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

// Status badge only component
export function CandidateStatusBadge({
  status,
  className
}: {
  status: PotentialCandidate['candidacy_status']
  className?: string
}) {
  return (
    <Badge className={cn(getCandidacyStatusColor(status), className)}>
      {formatCandidacyStatus(status)}
    </Badge>
  )
}

// Eligibility info component
export function CandidateEligibilityInfo({
  candidate,
  className
}: {
  candidate: PotentialCandidate
  className?: string
}) {
  if (
    candidate.eligible_positions.length === 0 &&
    candidate.eligible_election_types.length === 0
  ) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {candidate.eligible_positions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Eligible Positions</p>
          <div className="flex flex-wrap gap-1">
            {candidate.eligible_positions.map((position) => (
              <Badge key={position} variant="secondary" className="text-xs">
                {position}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {candidate.eligible_election_types.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Election Types</p>
          <div className="flex flex-wrap gap-1">
            {candidate.eligible_election_types.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
