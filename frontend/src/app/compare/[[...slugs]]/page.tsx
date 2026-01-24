'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  PoliticianSelector,
  SelectedPoliticians,
  ComparisonCard,
  ComparisonBar
} from '@/components/comparison'
import { SocialShareButtons } from '@/components/sharing'
import {
  getPoliticianComparison,
  generateComparisonUrl,
  generateComparisonInsights,
  parseComparisonSlugs,
  ComparisonPolitician,
  ComparisonInsight
} from '@/lib/comparison'
import {
  Scale,
  TrendingUp,
  Users,
  Lightbulb,
  ArrowLeft,
  Share2
} from 'lucide-react'
import Link from 'next/link'

export default function ComparePage() {
  const router = useRouter()
  const params = useParams()
  const isInitialized = useRef(false)
  const lastUrlUpdate = useRef<string>('')

  // Initialize from URL params
  const initialSlugs = parseComparisonSlugs(params.slugs as string[] | undefined)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs)
  const [politicians, setPoliticians] = useState<ComparisonPolitician[]>([])
  const [insights, setInsights] = useState<ComparisonInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync from URL when params change (e.g., browser back/forward)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      return
    }
    const slugsFromUrl = parseComparisonSlugs(params.slugs as string[] | undefined)
    const currentUrl = generateComparisonUrl(slugsFromUrl)
    if (currentUrl !== lastUrlUpdate.current) {
      setSelectedSlugs(slugsFromUrl)
    }
  }, [params.slugs])

  // Fetch comparison data when slugs change
  const fetchComparison = useCallback(async () => {
    if (selectedSlugs.length === 0) {
      setPoliticians([])
      setInsights([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await getPoliticianComparison(selectedSlugs)

      if (fetchError) {
        setError(fetchError)
        return
      }

      if (data) {
        setPoliticians(data)
        setInsights(generateComparisonInsights(data))
      }
    } catch {
      setError('Failed to load comparison data')
    } finally {
      setLoading(false)
    }
  }, [selectedSlugs])

  useEffect(() => {
    fetchComparison()
  }, [fetchComparison])

  // Update URL when selection changes (debounced to prevent loops)
  useEffect(() => {
    const newUrl = generateComparisonUrl(selectedSlugs)
    if (newUrl !== window.location.pathname && newUrl !== lastUrlUpdate.current) {
      lastUrlUpdate.current = newUrl
      // Use window.history to avoid triggering re-renders
      window.history.replaceState(null, '', newUrl)
    }
  }, [selectedSlugs])

  const handleSelect = (slug: string) => {
    if (!selectedSlugs.includes(slug) && selectedSlugs.length < 4) {
      setSelectedSlugs(prev => [...prev, slug])
    }
  }

  const handleRemove = (slug: string) => {
    setSelectedSlugs(selectedSlugs.filter(s => s !== slug))
  }

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : ''

  const shareTitle = politicians.length >= 2
    ? `Compare ${politicians.map(p => p.name).join(' vs ')}`
    : 'Compare Politicians'

  // Find winner for highlighting
  const winner = politicians.length >= 2
    ? politicians.reduce((a, b) => ((a.fulfillment_rate || 0) > (b.fulfillment_rate || 0) ? a : b))
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-4 sm:py-8 px-4 sm:px-6">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <Link href="/politicians">
              <Button variant="ghost" size="sm" className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Politicians
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Scale className="h-6 w-6 sm:h-7 sm:w-7" />
                  Compare Politicians
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Select up to 4 politicians to compare
                </p>
              </div>

              {politicians.length >= 2 && (
                <SocialShareButtons
                  url={shareUrl}
                  title={shareTitle}
                  description="Compare political promise fulfillment rates"
                  variant="dropdown"
                  showLabels
                />
              )}
            </div>
          </div>

          {/* Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <PoliticianSelector
                  selectedSlugs={selectedSlugs}
                  onSelect={handleSelect}
                  onRemove={handleRemove}
                  maxSelections={4}
                />

                {/* Show selected slugs immediately, with names from politicians if available */}
                {selectedSlugs.length > 0 && (
                  <SelectedPoliticians
                    politicians={selectedSlugs.map(slug => {
                      const politician = politicians.find(p => p.slug === slug)
                      return {
                        slug,
                        name: politician?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        party: politician?.party || null
                      }
                    })}
                    onRemove={handleRemove}
                  />
                )}

                {selectedSlugs.length < 2 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select at least 2 politicians to start comparing</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-center text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {selectedSlugs.map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-muted rounded-full mb-4" />
                      <div className="h-6 w-32 bg-muted rounded mb-2" />
                      <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Comparison Results */}
          {!loading && politicians.length >= 2 && (
            <>
              {/* Comparison Cards */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {politicians.map((politician) => (
                  <ComparisonCard
                    key={politician.slug}
                    politician={politician}
                    onRemove={() => handleRemove(politician.slug)}
                    showRemove={politicians.length > 2}
                    isWinner={winner?.slug === politician.slug && politicians.length >= 2}
                  />
                ))}
              </div>

              <Separator />

              {/* Visual Comparisons */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                {/* Fulfillment Rate Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" />
                      Fulfillment Rate Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComparisonBar politicians={politicians} metric="rate" />
                  </CardContent>
                </Card>

                {/* Promise Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Scale className="h-5 w-5" />
                      Promise Status Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ComparisonBar politicians={politicians} metric="status" />
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              {insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.map((insight, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <Badge
                            variant={
                              insight.type === 'winner' ? 'default' :
                              insight.type === 'tie' ? 'secondary' : 'outline'
                            }
                            className="shrink-0 mt-0.5"
                          >
                            {insight.type === 'winner' ? 'Winner' :
                             insight.type === 'tie' ? 'Tie' : 'Insight'}
                          </Badge>
                          <p className="text-sm">{insight.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Share Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">Share this comparison</h3>
                      <p className="text-sm text-muted-foreground">
                        Let others see how these politicians compare
                      </p>
                    </div>
                    <SocialShareButtons
                      url={shareUrl}
                      title={shareTitle}
                      description={`Comparing ${politicians.map(p => p.name).join(', ')} on Political Accountability`}
                      hashtags={['IndianPolitics', 'Accountability']}
                      variant="inline"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
