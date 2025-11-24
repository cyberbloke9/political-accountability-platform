'use client'

import { AdminGuard } from '@/components/admin/AdminGuard'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  getCoordinatedVotingGroups,
  getExtremeBiasUsers,
  runVotePatternAnalysis,
  type CoordinatedVotingGroup,
  type UserPartyBias
} from '@/lib/votePatterns'
import { AlertTriangle, Loader2, Play, RefreshCw, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function VotePatternsPage() {
  const { toast } = useToast()
  const [biasUsers, setBiasUsers] = useState<UserPartyBias[]>([])
  const [coordinatedGroups, setCoordinatedGroups] = useState<CoordinatedVotingGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [biasResult, groupsResult] = await Promise.all([
      getExtremeBiasUsers(0.8),
      getCoordinatedVotingGroups()
    ])

    if (biasResult.error) {
      toast({
        title: 'Error',
        description: 'Failed to load extreme bias users',
        variant: 'destructive'
      })
    } else if (biasResult.data) {
      setBiasUsers(biasResult.data)
    }

    if (groupsResult.error) {
      toast({
        title: 'Error',
        description: 'Failed to load coordinated voting groups',
        variant: 'destructive'
      })
    } else if (groupsResult.data) {
      setCoordinatedGroups(groupsResult.data)
    }

    setLoading(false)
  }

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true)
    const { success, error } = await runVotePatternAnalysis()

    if (success) {
      toast({
        title: 'Success',
        description: 'Vote pattern analysis completed successfully'
      })
      await loadData()
    } else {
      toast({
        title: 'Error',
        description: error || 'Failed to run vote pattern analysis',
        variant: 'destructive'
      })
    }

    setAnalysisLoading(false)
  }

  const getBiasColor = (score: number) => {
    if (score > 0.9 || score < -0.9) return 'bg-red-100 text-red-800'
    if (score > 0.8 || score < -0.8) return 'bg-orange-100 text-orange-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getBiasLabel = (score: number) => {
    if (score > 0) return `+${(score * 100).toFixed(0)}% Pro`
    return `${(score * 100).toFixed(0)}% Against`
  }

  return (
    <AdminGuard requiredPermission="manage_fraud">
      <AdminLayout title="Vote Pattern Analysis" breadcrumbs={[{ label: 'Vote Patterns' }]}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted-foreground mt-2">
                Detect partisan bias and coordinated voting for India&apos;s multi-party democracy
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadData}
                variant="outline"
                disabled={loading || analysisLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleRunAnalysis}
                disabled={loading || analysisLoading}
              >
                {analysisLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Analysis
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Users with Extreme Bias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {biasUsers.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bias score &gt; 0.8 or &lt; -0.8
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Coordinated Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {coordinatedGroups.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suspected vote brigading
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Extreme Partisan Bias */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Extreme Partisan Bias</h2>
              {biasUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No users with extreme partisan bias detected.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {biasUsers.map(bias => (
                    <Card key={bias.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-semibold">{bias.user?.username || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">
                                Citizen Score: {bias.user?.citizen_score || 0}
                              </p>
                            </div>
                            <div>
                              <Badge variant="outline" className="text-sm">
                                {bias.party_name}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {bias.total_votes} votes
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bias.upvotes_count} up / {bias.downvotes_count} down
                              </p>
                            </div>
                            <Badge className={getBiasColor(bias.bias_score)}>
                              {bias.bias_score > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {getBiasLabel(bias.bias_score)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Coordinated Voting Groups */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Coordinated Voting Groups</h2>
              {coordinatedGroups.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No coordinated voting groups detected.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {coordinatedGroups.map(group => (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-red-100 p-3 rounded-full">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {group.group_members.length} users voted together
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {group.verification_ids.length} verification(s) affected
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Within {group.time_window_minutes} minutes
                              </p>
                              <p className="text-xs text-muted-foreground">
                                All {group.vote_type}s
                              </p>
                            </div>
                            <Badge
                              className={
                                group.coordination_score > 0.9
                                  ? 'bg-red-100 text-red-800'
                                  : group.coordination_score > 0.75
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {Math.round(group.coordination_score * 100)}% coordinated
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  )
}
