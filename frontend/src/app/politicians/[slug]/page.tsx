'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  getPoliticianBySlug,
  getPoliticianPromises,
  getPartyColor,
  formatPosition,
  getPoliticianStats,
  type Politician,
  type PoliticianStats
} from '@/lib/politicians'
import { FollowButton } from '@/components/FollowButton'
import { ReportCard } from '@/components/politicians/ReportCard'
import {
  User,
  MapPin,
  Building2,
  Calendar,
  ExternalLink,
  Twitter,
  Globe,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  PauseCircle,
  TrendingUp,
  ArrowLeft,
  Loader2,
  FileText
} from 'lucide-react'

interface Promise {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  status: string
  source_url: string
  tags: string[]
  verifications: Array<{
    id: string
    verdict: string
    status: string
  }>
}

interface Stats {
  total: number
  fulfilled: number
  broken: number
  in_progress: number
  pending: number
  stalled: number
  fulfillment_rate: number | null
}

export default function PoliticianProfilePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [politician, setPolitician] = useState<Politician | null>(null)
  const [promises, setPromises] = useState<Promise[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    fulfilled: 0,
    broken: 0,
    in_progress: 0,
    pending: 0,
    stalled: 0,
    fulfillment_rate: null
  })
  const [politicianStats, setPoliticianStats] = useState<PoliticianStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [promiseCount, setPromiseCount] = useState(0)
  const [showReportCard, setShowReportCard] = useState(false)

  useEffect(() => {
    if (slug) {
      loadPoliticianData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const loadPoliticianData = async () => {
    setLoading(true)
    try {
      const politicianData = await getPoliticianBySlug(slug)
      setPolitician(politicianData)

      if (politicianData) {
        const [promisesResult, statsResult] = await Promise.all([
          getPoliticianPromises(politicianData.name),
          getPoliticianStats(politicianData.name)
        ])

        const { data: promisesData, count } = promisesResult
        setPromises(promisesData || [])
        setPromiseCount(count)

        if (statsResult) {
          setPoliticianStats(statsResult)
        }

        // Calculate stats
        if (promisesData) {
          const fulfilled = promisesData.filter(p => p.status === 'fulfilled').length
          const broken = promisesData.filter(p => p.status === 'broken').length
          const in_progress = promisesData.filter(p => p.status === 'in_progress').length
          const pending = promisesData.filter(p => p.status === 'pending').length
          const stalled = promisesData.filter(p => p.status === 'stalled').length
          const decidedPromises = fulfilled + broken

          setStats({
            total: promisesData.length,
            fulfilled,
            broken,
            in_progress,
            pending,
            stalled,
            fulfillment_rate: decidedPromises > 0
              ? Math.round((fulfilled / decidedPromises) * 100)
              : null
          })
        }
      }
    } catch (error) {
      console.error('Error loading politician data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'broken':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'stalled':
        return <PauseCircle className="h-4 w-4 text-orange-600" />
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

  const filteredPromises = activeTab === 'all'
    ? promises
    : promises.filter(p => p.status === activeTab)

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!politician) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Politician Not Found</h2>
              <p className="text-muted-foreground mb-4">
                We couldn&apos;t find a politician with this profile.
              </p>
              <Link href="/politicians">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  View All Politicians
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="space-y-6">
          {/* Back button */}
          <Link href="/politicians" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Politicians
          </Link>

          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {politician.image_url ? (
                    <img
                      src={politician.image_url}
                      alt={politician.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{politician.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {politician.party && (
                        <Badge className={getPartyColor(politician.party)}>
                          {politician.party}
                        </Badge>
                      )}
                      {politician.position && (
                        <Badge variant="outline">
                          <Building2 className="h-3 w-3 mr-1" />
                          {formatPosition(politician.position)}
                        </Badge>
                      )}
                      {politician.state && (
                        <Badge variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {politician.state}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {politician.bio && (
                    <p className="text-muted-foreground">{politician.bio}</p>
                  )}

                  {/* Links */}
                  <div className="flex flex-wrap gap-2">
                    {politician.twitter_handle && (
                      <a
                        href={`https://twitter.com/${politician.twitter_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        <Twitter className="h-4 w-4 mr-1" />
                        @{politician.twitter_handle}
                      </a>
                    )}
                    {politician.wikipedia_url && (
                      <a
                        href={politician.wikipedia_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Wikipedia
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {politician.official_website && (
                      <a
                        href={politician.official_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Official Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>

                  {/* Follow & Report Card Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <FollowButton
                      targetType="politician"
                      targetId={politician.id}
                      targetName={politician.name}
                      showCount={true}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowReportCard(!showReportCard)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {showReportCard ? 'Hide Report Card' : 'View Report Card'}
                    </Button>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="flex-shrink-0 w-full md:w-64">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Total Promises</p>
                      </div>

                      {stats.fulfillment_rate !== null && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Fulfillment Rate</span>
                            <span className="font-medium">{stats.fulfillment_rate}%</span>
                          </div>
                          <Progress value={stats.fulfillment_rate} className="h-2" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>{stats.fulfilled} Fulfilled</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-600" />
                          <span>{stats.broken} Broken</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span>{stats.in_progress} In Progress</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <span>{stats.pending} Pending</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Card Section */}
          {showReportCard && politicianStats && (
            <ReportCard
              politician={{
                id: politician.id,
                name: politician.name,
                party: politician.party,
                position: politician.position,
                state: politician.state,
                image_url: politician.image_url
              }}
              stats={politicianStats}
            />
          )}

          {/* Promises Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Promises ({promiseCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  <TabsTrigger value="all">
                    All ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="fulfilled">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Fulfilled ({stats.fulfilled})
                  </TabsTrigger>
                  <TabsTrigger value="in_progress">
                    <Clock className="h-3 w-3 mr-1" />
                    In Progress ({stats.in_progress})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pending ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="broken">
                    <XCircle className="h-3 w-3 mr-1" />
                    Broken ({stats.broken})
                  </TabsTrigger>
                  <TabsTrigger value="stalled">
                    <PauseCircle className="h-3 w-3 mr-1" />
                    Stalled ({stats.stalled})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {filteredPromises.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No promises found in this category.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredPromises.map(promise => (
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
                                  <Badge className={getStatusBadge(promise.status)}>
                                    {promise.status.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(promise.promise_date).toLocaleDateString()}
                                  </span>
                                </div>

                                <p className="font-medium line-clamp-2">
                                  {promise.promise_text}
                                </p>

                                {promise.tags && promise.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {promise.tags.slice(0, 4).map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {promise.tags.length > 4 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{promise.tags.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="text-right text-sm text-muted-foreground">
                                {promise.verifications?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {promise.verifications.length} verification{promise.verifications.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
