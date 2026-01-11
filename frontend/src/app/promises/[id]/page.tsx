'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  Eye,
  FileText,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Share2,
  Tag,
  User
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { VerificationCard } from '@/components/verifications/VerificationCard'
import { FollowButton } from '@/components/FollowButton'
import { PromiseTimeline } from '@/components/promises/PromiseTimeline'
import { DiscussionThread } from '@/components/discussions/DiscussionThread'
import { recordPromiseView } from '@/lib/views'

interface Promise {
  id: string
  politician_name: string
  promise_text: string
  promise_date: string
  source_url?: string
  category?: string
  tags?: string[]
  status: 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled'
  image_url?: string
  view_count: number
  created_at: string
  updated_at: string
  created_by: string
  creator?: {
    username: string
  }
}

interface Verification {
  id: string
  verdict: 'fulfilled' | 'broken' | 'in_progress' | 'stalled'
  evidence_text: string
  evidence_urls?: string[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  upvotes: number
  downvotes: number
  submitter?: {
    username: string
    citizen_score: number
  }
}

const statusConfig = {
  pending: {
    label: 'Pending Verification',
    className: 'bg-muted text-muted-foreground',
    description: 'Awaiting evidence and verification'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-warning text-warning-foreground',
    description: 'Work has begun on this promise'
  },
  fulfilled: {
    label: 'Fulfilled',
    className: 'bg-success text-success-foreground',
    description: 'Promise has been completed'
  },
  broken: {
    label: 'Broken',
    className: 'bg-destructive text-destructive-foreground',
    description: 'Promise was not kept'
  },
  stalled: {
    label: 'Stalled',
    className: 'bg-muted text-muted-foreground',
    description: 'No progress has been made'
  },
}

export default function PromiseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [promise, setPromise] = useState<Promise | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationCount, setVerificationCount] = useState(0)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loadingVerifications, setLoadingVerifications] = useState(false)

  const fetchVerifications = useCallback(async () => {
    if (!params.id) return

    setLoadingVerifications(true)
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select(`
          *,
          submitter:users!submitted_by(username, citizen_score)
        `)
        .eq('promise_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setVerifications(data || [])
    } catch (error) {
      console.error('Error fetching verifications:', error)
      toast.error('Failed to load verifications')
    } finally {
      setLoadingVerifications(false)
    }
  }, [params.id])

  useEffect(() => {
    const fetchPromise = async () => {
      if (!params.id) return

      setLoading(true)
      try {
        // Fetch promise with creator info
        const { data: promiseData, error: promiseError } = await supabase
          .from('promises')
          .select(`
            *,
            creator:users!created_by(username)
          `)
          .eq('id', params.id)
          .single()

        if (promiseError) throw promiseError

        // Fetch verification count
        const { count, error: countError } = await supabase
          .from('verifications')
          .select('*', { count: 'exact', head: true })
          .eq('promise_id', params.id)

        if (!countError) {
          setVerificationCount(count || 0)
        }

        setPromise(promiseData)

        // Record view (with deduplication)
        recordPromiseView(params.id as string)

        // Fetch verifications
        fetchVerifications()
      } catch (error) {
        toast.error('Failed to load promise')
        console.error('Error fetching promise:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromise()
  }, [params.id, fetchVerifications])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Promise by ${promise?.politician_name}`,
          text: promise?.promise_text,
          url: url,
        })
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!promise) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-16 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Promise not found</h2>
            <p className="text-muted-foreground">
              The promise you&apos;re looking for doesn&apos;t exist or has been removed
            </p>
            <Button onClick={() => router.push('/promises')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Promises
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const status = statusConfig[promise.status]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6 md:py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" onClick={() => router.push('/promises')} className="sm:size-default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Back to Promises</span>
            <span className="xs:hidden">Back</span>
          </Button>

          {/* Main Content Card */}
          <Card>
            <CardHeader className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <Badge className={status.className + ' text-sm px-3 py-1'}>
                  {status.label}
                </Badge>
                <div className="flex gap-2">
                  <FollowButton
                    targetType="promise"
                    targetId={promise.id}
                    targetName="this promise"
                    variant="outline"
                    size="sm"
                  />
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Politician Name */}
              <div>
                <CardTitle className="text-3xl md:text-4xl">
                  {promise.politician_name}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {status.description}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Promise Image */}
              {promise.image_url && (
                <div className="rounded-lg overflow-hidden relative w-full h-48 sm:h-64 md:h-96">
                  <Image
                    src={promise.image_url}
                    alt="Promise related image"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Promise Text */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Promise</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {promise.promise_text}
                </p>
              </div>

              <Separator />

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Promise Date</p>
                    <p className="text-muted-foreground">
                      {new Date(promise.promise_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Views</p>
                    <p className="text-muted-foreground">
                      {promise.view_count.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Verifications</p>
                    <p className="text-muted-foreground">
                      {verificationCount} submitted
                    </p>
                  </div>
                </div>

                {promise.creator && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Submitted by</p>
                      <p className="text-muted-foreground">
                        {promise.creator.username}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Category & Tags */}
              {(promise.category || (promise.tags && promise.tags.length > 0)) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {promise.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{promise.category}</Badge>
                      </div>
                    )}
                    {promise.tags && promise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {promise.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Source URL */}
              {promise.source_url && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Source</h3>
                    <a
                      href={promise.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2 text-sm break-all"
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{promise.source_url}</span>
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Verifications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Verifications ({verificationCount})
              </CardTitle>
              <CardDescription>
                Community-submitted evidence and verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationCount === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">No verifications yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Be the first to submit evidence for this promise
                    </p>
                  </div>
                  <Link href={`/verifications/new?promise=${promise.id}`}>
                    <Button>Submit Verification</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {verificationCount} verification{verificationCount !== 1 ? 's' : ''} submitted
                    </p>
                    <Link href={`/verifications/new?promise=${promise.id}`}>
                      <Button variant="outline" size="sm">
                        Add Verification
                      </Button>
                    </Link>
                  </div>

                  {loadingVerifications ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-6">
                      {verifications.map((verification) => (
                        <VerificationCard
                          key={verification.id}
                          verification={verification}
                          onVoteChange={fetchVerifications}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussion Section */}
          <DiscussionThread
            targetType="promise"
            targetId={promise.id}
          />

          {/* Promise Timeline */}
          <PromiseTimeline
            promiseId={promise.id}
            showLifecycle={true}
            maxEvents={10}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
