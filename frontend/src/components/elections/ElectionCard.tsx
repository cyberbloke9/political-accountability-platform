'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  Users,
  Vote,
  ChevronRight,
  Building2
} from 'lucide-react'
import {
  Election,
  formatElectionType,
  formatElectionStatus,
  getElectionStatusColor,
  formatElectionLevel,
  getElectionLevelColor
} from '@/lib/elections'
import { ElectionLevelBadge } from './ElectionLevelTabs'

interface ElectionCardProps {
  election: Election
  showDetails?: boolean
}

export function ElectionCard({ election, showDetails = true }: ElectionCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntilPolling = getDaysUntil(election.polling_start)
  const isUpcoming = daysUntilPolling > 0
  const isOngoing = election.status === 'polling' || election.status === 'counting'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg line-clamp-2">{election.name}</CardTitle>
            <CardDescription className="flex items-center flex-wrap gap-2">
              {election.election_level && (
                <ElectionLevelBadge level={election.election_level} showIcon={false} />
              )}
              <Badge variant="outline" className="font-normal">
                {formatElectionType(election.election_type)}
              </Badge>
              {election.state && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {election.state}
                </span>
              )}
            </CardDescription>
          </div>
          <Badge className={getElectionStatusColor(election.status)}>
            {formatElectionStatus(election.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Polling</p>
              <p className="font-medium">
                {formatDate(election.polling_start)}
                {election.polling_start !== election.polling_end && (
                  <> - {formatDate(election.polling_end)}</>
                )}
              </p>
            </div>
          </div>

          {election.total_constituencies > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Constituencies</p>
                <p className="font-medium">{election.total_constituencies.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status indicator */}
        {isUpcoming && daysUntilPolling <= 30 && (
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              <Vote className="h-4 w-4 inline mr-1" />
              {daysUntilPolling === 1 ? 'Polling tomorrow!' : `${daysUntilPolling} days until polling`}
            </p>
          </div>
        )}

        {isOngoing && (
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              <Vote className="h-4 w-4 inline mr-1" />
              {election.status === 'polling' ? 'Polling in progress' : 'Votes being counted'}
            </p>
          </div>
        )}

        {/* Turnout stats (for completed elections) */}
        {election.status === 'completed' && election.voter_turnout_percent && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            {election.total_votes_cast && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Votes Cast</p>
                  <p className="font-medium">{election.total_votes_cast.toLocaleString()}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Turnout</p>
              <p className="font-medium">{election.voter_turnout_percent}%</p>
            </div>
          </div>
        )}

        {/* View Details Button */}
        {showDetails && (
          <Link href={`/elections/${election.id}`}>
            <Button variant="outline" className="w-full">
              View Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for sidebars/widgets
export function ElectionCardCompact({ election }: { election: Election }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <Link href={`/elections/${election.id}`}>
      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{election.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatElectionType(election.election_type)}
            {election.state && ` - ${election.state}`}
          </p>
        </div>
        <div className="text-right ml-3">
          <Badge className={`text-xs ${getElectionStatusColor(election.status)}`}>
            {formatElectionStatus(election.status)}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(election.polling_start)}
          </p>
        </div>
      </div>
    </Link>
  )
}
