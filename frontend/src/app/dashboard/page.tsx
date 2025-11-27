'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ShieldCheck, TrendingUp, FileText, Vote, Trophy, Activity, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const stats = [
    {
      title: 'Promises Tracked',
      value: '0',
      icon: ShieldCheck,
      description: 'Promises you are following',
      color: 'text-primary',
    },
    {
      title: 'Verifications',
      value: '0',
      icon: FileText,
      description: 'Evidence you submitted',
      color: 'text-secondary',
    },
    {
      title: 'Votes Cast',
      value: '0',
      icon: Vote,
      description: 'Total votes on verifications',
      color: 'text-success',
    },
    {
      title: 'Citizen Score',
      value: '0',
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track promises, verify claims, and contribute to political accountability
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
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
            <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <Link href="/promises/new">
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Promise
                </Button>
              </Link>
              <Link href="/promises">
                <Button className="w-full" variant="outline">
                  <Scale className="mr-2 h-4 w-4" />
                  Browse Promises
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

          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-grid">
              <TabsTrigger value="activity" className="text-xs sm:text-sm">
                <Activity className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Recent Activity</span>
                <span className="sm:hidden">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="tracked" className="text-xs sm:text-sm">
                <Scale className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tracked Promises</span>
                <span className="sm:hidden">Tracked</span>
              </TabsTrigger>
              <TabsTrigger value="verifications" className="text-xs sm:text-sm">
                <FileText className="mr-0 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">My Verifications</span>
                <span className="sm:hidden">Verifications</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Feed</CardTitle>
                  <CardDescription>
                    Your recent contributions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No activity yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start tracking promises or submit verifications to see your activity
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracked" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tracked Promises</CardTitle>
                  <CardDescription>
                    Promises you are monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Scale className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tracked promises</p>
                    <Link href="/promises" className="mt-4">
                      <Button variant="outline">Browse Promises</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Verifications</CardTitle>
                  <CardDescription>
                    Evidence you have submitted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No verifications yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Help verify political promises with evidence
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
