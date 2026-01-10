'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Vote,
  Building2,
  FileText,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import {
  Election,
  Candidate,
  Manifesto,
  getElectionById,
  getElectionCandidates,
  getManifestos,
  formatElectionType,
  formatElectionStatus,
  getElectionStatusColor
} from '@/lib/elections'
import { toast } from 'sonner'

export default function ElectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [manifestos, setManifestos] = useState<Manifesto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return

      setLoading(true)
      try {
        // Fetch election details
        const { data: electionData, error: electionError } = await getElectionById(params.id as string)
        if (electionError || !electionData) {
          toast.error('Election not found')
          router.push('/elections')
          return
        }
        setElection(electionData)

        // Fetch candidates
        const { data: candidatesData } = await getElectionCandidates(params.id as string)
        if (candidatesData) setCandidates(candidatesData)

        // Fetch manifestos
        const { data: manifestosData } = await getManifestos(params.id as string)
        if (manifestosData) setManifestos(manifestosData)
      } catch (error) {
        console.error('Error fetching election:', error)
        toast.error('Failed to load election')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!election) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Vote className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Election not found</h2>
            <p className="text-muted-foreground">
              The election you&apos;re looking for doesn&apos;t exist
            </p>
            <Button onClick={() => router.push('/elections')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Elections
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const winners = candidates.filter(c => c.is_winner)
  const partyResults = candidates.reduce((acc, c) => {
    const partyName = c.party_name || 'Independent'
    if (c.is_winner) {
      acc[partyName] = (acc[partyName] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" onClick={() => router.push('/elections')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Elections
          </Button>

          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {formatElectionType(election.election_type)}
                    </Badge>
                    <Badge className={getElectionStatusColor(election.status)}>
                      {formatElectionStatus(election.status)}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">{election.name}</CardTitle>
                  {election.state && (
                    <CardDescription className="flex items-center gap-1 text-base">
                      <MapPin className="h-4 w-4" />
                      {election.state}, {election.country}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Key Dates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Polling Starts</p>
                  <p className="font-medium">{formatDate(election.polling_start)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Polling Ends</p>
                  <p className="font-medium">{formatDate(election.polling_end)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Counting Date</p>
                  <p className="font-medium">{formatDate(election.counting_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Results Date</p>
                  <p className="font-medium">{formatDate(election.results_date)}</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{election.total_constituencies || 0}</p>
                    <p className="text-sm text-muted-foreground">Constituencies</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {election.total_voters_registered
                        ? `${(election.total_voters_registered / 10000000).toFixed(1)}Cr`
                        : 'TBA'}
                    </p>
                    <p className="text-sm text-muted-foreground">Voters</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Vote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{candidates.length}</p>
                    <p className="text-sm text-muted-foreground">Candidates</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {election.voter_turnout_percent
                        ? `${election.voter_turnout_percent}%`
                        : 'TBA'}
                    </p>
                    <p className="text-sm text-muted-foreground">Turnout</p>
                  </div>
                </div>
              </div>

              {election.official_url && (
                <div className="mt-6">
                  <a
                    href={election.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Official Election Commission Page
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="candidates">
                Candidates ({candidates.length})
              </TabsTrigger>
              <TabsTrigger value="manifestos">
                Manifestos ({manifestos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Results Summary (if completed) */}
              {election.status === 'completed' && winners.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Results Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Party-wise seat distribution
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(partyResults)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 8)
                          .map(([party, seats]) => (
                            <div
                              key={party}
                              className="p-3 rounded-lg border bg-muted/30"
                            >
                              <p className="font-medium truncate">{party}</p>
                              <p className="text-2xl font-bold">{seats}</p>
                              <p className="text-xs text-muted-foreground">seats won</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Election Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Announcement', date: election.announcement_date, icon: AlertCircle },
                      { label: 'Nominations Start', date: election.nomination_start, icon: FileText },
                      { label: 'Nominations End', date: election.nomination_end, icon: FileText },
                      { label: 'Polling Begins', date: election.polling_start, icon: Vote },
                      { label: 'Polling Ends', date: election.polling_end, icon: Vote },
                      { label: 'Counting', date: election.counting_date, icon: TrendingUp },
                      { label: 'Results', date: election.results_date, icon: CheckCircle2 }
                    ].filter(item => item.date).map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="candidates" className="mt-6">
              {candidates.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Candidates Yet</h3>
                    <p className="text-muted-foreground">
                      Candidate information will be available after nominations are filed.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {candidates.length} candidates across all constituencies
                  </p>
                  <div className="grid gap-4">
                    {candidates.slice(0, 20).map((candidate) => (
                      <Card key={candidate.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                {candidate.photo_url ? (
                                  <img
                                    src={candidate.photo_url}
                                    alt={candidate.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{candidate.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {candidate.party_name || 'Independent'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {candidate.is_winner && (
                                <Badge className="bg-green-100 text-green-800 mb-1">
                                  Winner
                                </Badge>
                              )}
                              {candidate.votes_received && (
                                <p className="text-sm">
                                  {candidate.votes_received.toLocaleString()} votes
                                  {candidate.vote_share_percent && (
                                    <span className="text-muted-foreground">
                                      {' '}({candidate.vote_share_percent}%)
                                    </span>
                                  )}
                                </p>
                              )}
                              {candidate.criminal_cases_count > 0 && (
                                <p className="text-xs text-orange-600">
                                  {candidate.criminal_cases_count} criminal case(s)
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {candidates.length > 20 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Showing 20 of {candidates.length} candidates
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="manifestos" className="mt-6">
              {manifestos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Manifestos Yet</h3>
                    <p className="text-muted-foreground">
                      Party manifestos will be uploaded as they are released.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {manifestos.map((manifesto) => (
                    <Card key={manifesto.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{manifesto.title}</CardTitle>
                        <CardDescription>
                          {manifesto.language} | {manifesto.page_count || '?'} pages
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {manifesto.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {manifesto.summary}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={manifesto.processing_status === 'completed' ? 'default' : 'secondary'}
                          >
                            {manifesto.promises_extracted} promises extracted
                          </Badge>
                          {manifesto.document_url && (
                            <a
                              href={manifesto.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              View PDF
                            </a>
                          )}
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
