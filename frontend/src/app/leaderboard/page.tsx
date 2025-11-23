'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard'

export default function LeaderboardPage() {
  const { leaderboard, loading, error } = useRealtimeLeaderboard(50)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-warning" />
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />
    if (rank === 3) return <Award className="h-5 w-5 text-warning/70" />
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8 px-4">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Citizen Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Top contributors to political accountability
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2 w-fit">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Live Updates</span>
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive">Error loading leaderboard</p>
              </CardContent>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No citizens ranked yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start contributing to appear on the leaderboard
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {leaderboard.map((entry, index) => {
                const rank = index + 1
                const rankIcon = getRankIcon(rank)

                return (
                  <Card
                    key={entry.user_id}
                    className={
                      rank <= 3
                        ? 'border-2 border-primary/20 bg-primary/5'
                        : ''
                    }
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted font-bold text-base sm:text-lg flex-shrink-0">
                          {rankIcon || rank}
                        </div>

                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {entry.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base sm:text-lg truncate">
                              {entry.username}
                            </h3>
                            {entry.title && (
                              <Badge variant="secondary" className="text-xs">{entry.title}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                            <span className="whitespace-nowrap">
                              {entry.total_promises_created} promises
                            </span>
                            <span className="whitespace-nowrap">
                              {entry.total_verifications_submitted} verifications
                            </span>
                            <span className="whitespace-nowrap">{entry.total_votes_cast} votes</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-xl sm:text-2xl font-bold text-primary">
                            {entry.total_score.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            points
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
