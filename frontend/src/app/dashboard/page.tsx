'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  TrendingUp,
  FileText,
  Vote,
  Trophy,
  Activity,
  Plus,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  getPersonalizedFeed,
  getFollowedPoliticians,
  getFollowedPromises,
  getUserFollows
} from '@/lib/follows'
import { FollowButtonCompact } from '@/components/FollowButton'

interface DashboardStats {
  promisesTracked: number
  politiciansFollowed: number
  verificationsSubmitted: number
  votesCast: number
  citizenScore: number
}

interface FeedItem {
  id: string
  politician_name: string
  promise_text: string
  status: string
  updated_at: string
  tags?: string[]
}

export default function DashboardPage() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    promisesTracked: 0,
    politiciansFollowed: 0,
    verificationsSubmitted: 0,
    votesCast: 0,
    citizenScore: 0
  })
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [followedPoliticians, setFollowedPoliticians] = useState<any[]>([])
  const [followedPromises, setFollowedPromises] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  const loadDashboardData = async () => {
    setLoadingData(true)
    try {
      // Load all data in parallel
      const [
        feedResult,
        politiciansResult,
        promisesResult,
        followsResult,
        userStatsResult
      ] = await Promise.all([
        getPersonalizedFeed(20),
        getFollowedPoliticians(),
        getFollowedPromises(),
        getUserFollows(),
        loadUserStats()
      ])

      if (feedResult.data) {
        setFeedItems(feedResult.data)
      }

      if (politiciansResult.data) {
        setFollowedPoliticians(politiciansResult.data)
      }

      if (promisesResult.data) {
        setFollowedPromises(promisesResult.data)
      }

      // Calculate follow counts
      const politicianFollows = followsResult.data?.filter(f => f.follow_type === 'politician').length || 0
      const promiseFollows = followsResult.data?.filter(f => f.follow_type === 'promise').length || 0

      setStats(prev => ({
        ...prev,
        promisesTracked: promiseFollows,
        politiciansFollowed: politicianFollows,
        ...userStatsResult
      }))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return {}

      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id, citizen_score')
        .eq('auth_id', authUser.id)
        .single()

      if (!userData) return {}

      // Get verification count
      const { count: verificationCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', userData.id)

      // Get vote count
      const { count: voteCount } = await supabase
        .from('verification_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id)

      return {
        verificationsSubmitted: verificationCount || 0,
        votesCast: voteCount || 0,
        citizenScore: userData.citizen_score || 0
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
      return {}
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'broken':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      fulfilled: 'bg-green-100 text-green-800',
      broken: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      stalled: 'bg-orange-100 text-orange-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const statsCards = [
    {
      title: 'Promises Tracked',
      value: stats.promisesTracked.toString(),
      icon: ShieldCheck,
      description: 'Promises you are following',
      color: 'text-primary',
    },
    {
      title: 'Politicians Followed',
      value: stats.politiciansFollowed.toString(),
      icon: Users,
      description: 'Politicians you monitor',
      color: 'text-indigo-500',
    },
    {
      title: 'Verifications',
      value: stats.verificationsSubmitted.toString(),
      icon: FileText,
      description: 'Evidence you submitted',
      color: 'text-secondary',
    },
    {
      title: 'Citizen Score',
      value: stats.citizenScore.toString(),
      icon: Trophy,
      description: 'Your contribution points',
      color: 'text-warning',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8 px-4">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track promises, verify claims, and contribute to political accountability
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            {statsCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={'h-4 w-4 ' + stat.color} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Start contributing to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Link href="/promises/new">
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Promise
                </Button>
              </Link>
              <Link href="/promises">
                <Button className="w-full" variant="outline">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Browse Promises
                </Button>
              </Link>
              <Link href="/politicians">
                <Button className="w-full" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Browse Politicians
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button className="w-full" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Tabs defaultValue="feed" className="space-y-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-grid">
              <TabsTrigger value="feed" className="text-xs sm:text-sm">
                <Activity className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Your Feed</span>
                <span className="sm:hidden">Feed</span>
              </TabsTrigger>
              <TabsTrigger value="politicians" className="text-xs sm:text-sm">
                <Users className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Politicians</span>
                <span className="sm:hidden">People</span>
              </TabsTrigger>
              <TabsTrigger value="tracked" className="text-xs sm:text-sm">
                <ShieldCheck className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tracked</span>
                <span className="sm:hidden">Tracked</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">
                <Bell className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
            </TabsList>

            {/* Personalized Feed */}
            <TabsContent value="feed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Feed</CardTitle>
                  <CardDescription>
                    Updates from politicians and promises you follow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : feedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Your feed is empty</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Follow politicians and promises to see updates here
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Link href="/politicians">
                          <Button variant="outline" size="sm">
                            <Users className="mr-2 h-4 w-4" />
                            Find Politicians
                          </Button>
                        </Link>
                        <Link href="/promises">
                          <Button variant="outline" size="sm">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Browse Promises
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {feedItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/promises/${item.id}`}
                          className="block"
                        >
                          <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusIcon(item.status)}
                                  <span className="font-medium">{item.politician_name}</span>
                                  <Badge className={getStatusBadge(item.status)}>
                                    {item.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.promise_text}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Updated {new Date(item.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <FollowButtonCompact
                                targetType="promise"
                                targetId={item.id}
                              />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Followed Politicians */}
            <TabsContent value="politicians" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Followed Politicians</CardTitle>
                  <CardDescription>
                    Politicians you are monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : followedPoliticians.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No politicians followed</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Follow politicians to track their promises
                      </p>
                      <Link href="/politicians" className="mt-4">
                        <Button variant="outline">Browse Politicians</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      {followedPoliticians.map((politician) => (
                        <Link
                          key={politician.id}
                          href={`/politicians/${politician.slug}`}
                          className="block"
                        >
                          <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                              {politician.image_url ? (
                                <img
                                  src={politician.image_url}
                                  alt={politician.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-primary/40" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{politician.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {politician.party || 'Independent'}
                                </p>
                              </div>
                              <FollowButtonCompact
                                targetType="politician"
                                targetId={politician.id}
                              />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tracked Promises */}
            <TabsContent value="tracked" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tracked Promises</CardTitle>
                  <CardDescription>
                    Promises you are monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : followedPromises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tracked promises</p>
                      <Link href="/promises" className="mt-4">
                        <Button variant="outline">Browse Promises</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {followedPromises.map((promise) => (
                        <Link
                          key={promise.id}
                          href={`/promises/${promise.id}`}
                          className="block"
                        >
                          <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getStatusIcon(promise.status)}
                                  <span className="font-medium">{promise.politician_name}</span>
                                  <Badge className={getStatusBadge(promise.status)}>
                                    {promise.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {promise.promise_text}
                                </p>
                              </div>
                              <FollowButtonCompact
                                targetType="promise"
                                targetId={promise.id}
                              />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Updates about promises and politicians you follow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No new notifications</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You'll be notified when there are updates to items you follow
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
