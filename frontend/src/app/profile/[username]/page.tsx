'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PromiseCard } from '@/components/promises/PromiseCard'
import { supabase } from '@/lib/supabase'
import { User, Calendar, Award, FileText, CheckCircle, ThumbsUp, Settings, Shield, ShieldAlert, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface UserProfile {
  id: string
  username: string
  email: string
  citizen_score: number
  created_at: string
  trust_level?: 'admin' | 'trusted_community' | 'community' | 'untrusted'
}

interface UserStats {
  promises_created: number
  verifications_submitted: number
  votes_cast: number
  verifications_approved: number
  verifications_rejected: number
  account_age_days: number
}

export default function ProfilePage() {
  const params = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    promises_created: 0,
    verifications_submitted: 0,
    votes_cast: 0,
    verifications_approved: 0,
    verifications_rejected: 0,
    account_age_days: 0
  })
  const [promises, setPromises] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [params.username])

  const fetchProfile = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', params.username)
        .single()

      if (userError) throw userError
      setProfile(userData)

      if (currentUser) {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', currentUser.id)
          .single()

        setIsOwnProfile(currentUserData?.id === userData.id)
      }

      const { count: promisesCount } = await supabase
        .from('promises')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userData.id)

      const { count: verificationsCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', userData.id)

      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id)

      const { count: approvedCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', userData.id)
        .eq('status', 'approved')

      const { count: rejectedCount } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', userData.id)
        .eq('status', 'rejected')

      // Calculate trust level from database function
      const { data: trustData } = await supabase
        .rpc('calculate_trust_level', { p_user_id: userData.id })

      // Calculate account age
      const accountAge = Math.floor(
        (new Date().getTime() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      setProfile({ ...userData, trust_level: trustData })

      setStats({
        promises_created: promisesCount || 0,
        verifications_submitted: verificationsCount || 0,
        votes_cast: votesCount || 0,
        verifications_approved: approvedCount || 0,
        verifications_rejected: rejectedCount || 0,
        account_age_days: accountAge
      })

      const { data: promisesData } = await supabase
        .from('promises')
        .select('*')
        .eq('created_by', userData.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const promisesWithCounts = await Promise.all(
        (promisesData || []).map(async (promise) => {
          const { count } = await supabase
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .eq('promise_id', promise.id)
          return { ...promise, verification_count: count || 0 }
        })
      )

      setPromises(promisesWithCounts)

      const { data: verificationsData } = await supabase
        .from('verifications')
        .select('*, promise:promises(id, politician_name, promise_text)')
        .eq('submitted_by', userData.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setVerifications(verificationsData || [])

    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <div className="text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">User not found</h2>
            <p className="text-muted-foreground">This user doesn&apos;t exist</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const getCitizenTitle = (score: number) => {
    if (score >= 500) return { title: 'Champion', color: 'text-yellow-600' }
    if (score >= 300) return { title: 'Guardian', color: 'text-purple-600' }
    if (score >= 200) return { title: 'Watchdog', color: 'text-blue-600' }
    return { title: 'Citizen', color: 'text-gray-600' }
  }

  const citizenTitle = getCitizenTitle(profile.citizen_score)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{profile.username}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={citizenTitle.color + ' border-0'}>
                        <Award className="h-3 w-3 mr-1" />
                        {citizenTitle.title}
                      </Badge>
                      <Badge variant="outline">
                        Score: {profile.citizen_score}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Member since {format(new Date(profile.created_at), 'MMM yyyy')}
                    </p>
                  </div>
                </div>
                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trust Level Progression Card */}
          {profile.trust_level && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Trust Level & Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {profile.trust_level === 'admin' && (
                    <>
                      <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-base px-3 py-1">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin (3.0x Weight)
                      </Badge>
                      <span className="text-sm text-muted-foreground">Highest trust level</span>
                    </>
                  )}
                  {profile.trust_level === 'trusted_community' && (
                    <>
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-base px-3 py-1">
                        <Shield className="h-4 w-4 mr-2" />
                        Trusted Community (2.0x Weight)
                      </Badge>
                      <span className="text-sm text-muted-foreground">Established contributor</span>
                    </>
                  )}
                  {profile.trust_level === 'community' && (
                    <>
                      <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20 text-base px-3 py-1">
                        <User className="h-4 w-4 mr-2" />
                        Community (1.0x Weight)
                      </Badge>
                      <span className="text-sm text-muted-foreground">Regular member</span>
                    </>
                  )}
                  {profile.trust_level === 'untrusted' && (
                    <>
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-base px-3 py-1">
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        New User (0.5x Weight)
                      </Badge>
                      <span className="text-sm text-muted-foreground">Building reputation</span>
                    </>
                  )}
                </div>

                {profile.trust_level !== 'admin' && (
                  <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Requirements for Next Level
                    </div>
                    {profile.trust_level === 'untrusted' && (
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">To reach Community level, you need:</p>
                        <ul className="space-y-1 ml-4">
                          <li className={profile.citizen_score >= 100 ? 'text-green-600' : 'text-muted-foreground'}>
                            • Citizen Score: {profile.citizen_score}/100
                          </li>
                          <li className={stats.account_age_days >= 7 ? 'text-green-600' : 'text-muted-foreground'}>
                            • Account Age: {stats.account_age_days}/7 days
                          </li>
                          <li className={
                            (stats.verifications_approved + stats.verifications_rejected) > 0 &&
                            (stats.verifications_rejected / (stats.verifications_approved + stats.verifications_rejected)) < 0.5
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                          }>
                            • Rejection Rate: &lt;50% ({stats.verifications_approved + stats.verifications_rejected > 0
                              ? Math.round((stats.verifications_rejected / (stats.verifications_approved + stats.verifications_rejected)) * 100)
                              : 0}%)
                          </li>
                        </ul>
                      </div>
                    )}
                    {profile.trust_level === 'community' && (
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">To reach Trusted Community level, you need:</p>
                        <ul className="space-y-1 ml-4">
                          <li className={profile.citizen_score >= 500 ? 'text-green-600' : 'text-muted-foreground'}>
                            • Citizen Score: {profile.citizen_score}/500
                          </li>
                          <li className={stats.verifications_approved >= 10 ? 'text-green-600' : 'text-muted-foreground'}>
                            • Approved Verifications: {stats.verifications_approved}/10
                          </li>
                          <li className={stats.account_age_days >= 30 ? 'text-green-600' : 'text-muted-foreground'}>
                            • Account Age: {stats.account_age_days}/30 days
                          </li>
                          <li className={
                            (stats.verifications_approved + stats.verifications_rejected) > 0 &&
                            (stats.verifications_rejected / (stats.verifications_approved + stats.verifications_rejected)) < 0.2
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                          }>
                            • Rejection Rate: &lt;20% ({stats.verifications_approved + stats.verifications_rejected > 0
                              ? Math.round((stats.verifications_rejected / (stats.verifications_approved + stats.verifications_rejected)) * 100)
                              : 0}%)
                          </li>
                        </ul>
                      </div>
                    )}
                    {profile.trust_level === 'trusted_community' && (
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">You've reached the highest community trust level! Keep contributing quality verifications.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Promises Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.promises_created}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.verifications_submitted}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Votes Cast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.votes_cast}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.verifications_approved}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="promises" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="promises">Promises ({stats.promises_created})</TabsTrigger>
              <TabsTrigger value="verifications">Verifications ({stats.verifications_submitted})</TabsTrigger>
            </TabsList>

            <TabsContent value="promises" className="mt-6">
              {promises.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No promises created yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promises.map((promise) => (
                    <PromiseCard key={promise.id} promise={promise} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="verifications" className="mt-6">
              {verifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No verifications submitted yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {verifications.map((verification) => (
                    <Card key={verification.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <Link href={`/promises/${verification.promise.id}`} className="hover:underline">
                                <h3 className="font-semibold mb-1">{verification.promise.politician_name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{verification.promise.promise_text}</p>
                              </Link>
                            </div>
                            <Badge className={
                              verification.verdict === 'fulfilled' ? 'bg-success' :
                              verification.verdict === 'broken' ? 'bg-destructive' :
                              verification.verdict === 'in_progress' ? 'bg-warning' :
                              'bg-muted'
                            }>
                              {verification.verdict}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{verification.evidence_text}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{format(new Date(verification.created_at), 'MMM d, yyyy')}</span>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" /> {verification.upvotes}
                              </span>
                              <Badge variant={verification.status === 'approved' ? 'default' : verification.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {verification.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
