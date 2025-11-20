'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Loader2, Upload, X, FileText, Plus, ExternalLink } from 'lucide-react'

const VERDICTS = [
  {
    value: 'fulfilled',
    label: 'Fulfilled',
    description: 'The promise has been completely kept',
  },
  {
    value: 'broken',
    label: 'Broken',
    description: 'The promise was not kept',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    description: 'Work has begun but not completed',
  },
  {
    value: 'needs_more_time',
    label: 'Needs More Time',
    description: 'Progress is being made, more time needed',
  },
]

interface Promise {
  id: string
  politician_name: string
  promise_text: string
}

export default function NewVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [evidenceFilePreviews, setEvidenceFilePreviews] = useState<string[]>([])

  const [promises, setPromises] = useState<Promise[]>([])
  const [loadingPromises, setLoadingPromises] = useState(true)

  const [formData, setFormData] = useState({
    promise_id: searchParams.get('promise') || '',
    verdict: '',
    evidence_text: '',
    evidence_urls: [''] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  // Fetch promises for selection
  useEffect(() => {
    const fetchPromises = async () => {
      try {
        const { data, error } = await supabase
          .from('promises')
          .select('id, politician_name, promise_text')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        setPromises(data || [])
      } catch (error) {
        console.error('Error fetching promises:', error)
        toast.error('Failed to load promises')
      } finally {
        setLoadingPromises(false)
      }
    }

    fetchPromises()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.promise_id) {
      newErrors.promise_id = 'Please select a promise to verify'
    }

    if (!formData.verdict) {
      newErrors.verdict = 'Please select a verdict'
    }

    if (!formData.evidence_text.trim()) {
      newErrors.evidence_text = 'Evidence description is required'
    } else if (formData.evidence_text.trim().length < 20) {
      newErrors.evidence_text = 'Evidence must be at least 20 characters'
    }

    // Validate URLs if provided
    formData.evidence_urls.forEach((url, index) => {
      if (url.trim() && !isValidUrl(url.trim())) {
        newErrors[`url_${index}`] = 'Please enter a valid URL'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Check total file count
    if (evidenceFiles.length + files.length > 10) {
      toast.error('Maximum 10 files allowed')
      return
    }

    // Check file sizes
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 10MB)`)
        return
      }
    }

    // Add files and previews
    setEvidenceFiles(prev => [...prev, ...files])

    // Generate previews for images
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setEvidenceFilePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      } else {
        setEvidenceFilePreviews(prev => [...prev, ''])
      }
    })
  }

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index))
    setEvidenceFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const addEvidenceUrl = () => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: [...prev.evidence_urls, '']
    }))
  }

  const removeEvidenceUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence_urls: prev.evidence_urls.filter((_, i) => i !== index)
    }))
  }

  const updateEvidenceUrl = (index: number, value: string) => {
    const newUrls = [...formData.evidence_urls]
    newUrls[index] = value
    setFormData(prev => ({ ...prev, evidence_urls: newUrls }))
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (evidenceFiles.length === 0) return []

    const uploadedUrls: string[] = []

    for (const file of evidenceFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('verification-evidence')
        .upload(filePath, file)

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`)
        continue
      }

      const { data } = supabase.storage
        .from('verification-evidence')
        .getPublicUrl(filePath)

      uploadedUrls.push(data.publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    if (!user) {
      toast.error('You must be logged in to submit a verification')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload files
      const uploadedFileUrls = await uploadFiles()

      // Get user's database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (userError || !userData) {
        toast.error('Failed to fetch user data')
        setIsSubmitting(false)
        return
      }

      // Combine all evidence URLs (manual + uploaded)
      const allEvidenceUrls = [
        ...formData.evidence_urls.filter(url => url.trim()),
        ...uploadedFileUrls
      ]

      // Insert verification
      const { data: verification, error: insertError } = await supabase
        .from('verifications')
        .insert({
          promise_id: formData.promise_id,
          submitted_by: userData.id,
          verdict: formData.verdict,
          evidence_text: formData.evidence_text.trim(),
          evidence_urls: allEvidenceUrls.length > 0 ? allEvidenceUrls : null,
          status: 'pending',
        })
        .select()
        .single()

      if (insertError) {
        toast.error('Failed to submit verification: ' + insertError.message)
        setIsSubmitting(false)
        return
      }

      toast.success('Verification submitted successfully!')
      router.push(`/promises/${formData.promise_id}`)
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8 md:py-12 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Submit Verification
            </h1>
            <p className="text-muted-foreground mt-2">
              Provide evidence to verify the status of a political promise
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Verification Details</CardTitle>
                <CardDescription>
                  Submit evidence and your verdict on a promise's status
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Promise Selection */}
                <div className="space-y-2">
                  <Label htmlFor="promise">Select Promise *</Label>
                  {loadingPromises ? (
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  ) : (
                    <Select
                      value={formData.promise_id}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, promise_id: value }))
                        setErrors(prev => ({ ...prev, promise_id: '' }))
                      }}
                    >
                      <SelectTrigger className={errors.promise_id ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Choose a promise to verify..." />
                      </SelectTrigger>
                      <SelectContent>
                        {promises.map((promise) => (
                          <SelectItem key={promise.id} value={promise.id}>
                            <div className="py-1">
                              <div className="font-medium">{promise.politician_name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {promise.promise_text}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.promise_id && (
                    <p className="text-sm text-destructive">{errors.promise_id}</p>
                  )}
                </div>

                {/* Verdict Selection */}
                <div className="space-y-2">
                  <Label htmlFor="verdict">Your Verdict *</Label>
                  <Select
                    value={formData.verdict}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, verdict: value }))
                      setErrors(prev => ({ ...prev, verdict: '' }))
                    }}
                  >
                    <SelectTrigger className={errors.verdict ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select the promise status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {VERDICTS.map((verdict) => (
                        <SelectItem key={verdict.value} value={verdict.value}>
                          <div className="py-1">
                            <div className="font-medium">{verdict.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {verdict.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.verdict && (
                    <p className="text-sm text-destructive">{errors.verdict}</p>
                  )}
                </div>

                {/* Evidence Text */}
                <div className="space-y-2">
                  <Label htmlFor="evidence">Evidence Description *</Label>
                  <Textarea
                    id="evidence"
                    placeholder="Describe the evidence supporting your verdict. Include specific details, dates, and sources..."
                    rows={6}
                    value={formData.evidence_text}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, evidence_text: e.target.value }))
                      setErrors(prev => ({ ...prev, evidence_text: '' }))
                    }}
                    className={errors.evidence_text ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.evidence_text.length} characters (minimum 20)
                  </p>
                  {errors.evidence_text && (
                    <p className="text-sm text-destructive">{errors.evidence_text}</p>
                  )}
                </div>

                {/* Evidence URLs */}
                <div className="space-y-3">
                  <Label>Evidence URLs (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Add links to articles, videos, or documents that support your verification
                  </p>

                  {formData.evidence_urls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://example.com/article"
                        value={url}
                        onChange={(e) => {
                          updateEvidenceUrl(index, e.target.value)
                          setErrors(prev => ({ ...prev, [`url_${index}`]: '' }))
                        }}
                        className={errors[`url_${index}`] ? 'border-destructive' : ''}
                      />
                      {formData.evidence_urls.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeEvidenceUrl(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEvidenceUrl}
                    disabled={formData.evidence_urls.length >= 10}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another URL
                  </Button>
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <Label htmlFor="files">Evidence Files (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload images, videos, or documents (Max 10 files, 10MB each)
                  </p>

                  {evidenceFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {evidenceFiles.map((file, index) => (
                        <div key={index} className="relative border rounded-lg p-2">
                          {evidenceFilePreviews[index] ? (
                            <img
                              src={evidenceFilePreviews[index]}
                              alt={file.name}
                              className="w-full h-32 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <p className="text-xs truncate mt-2">{file.name}</p>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {evidenceFiles.length < 10 && (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <Input
                        id="files"
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf"
                        onChange={handleFileChange}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Verification...
                      </>
                    ) : (
                      'Submit Verification'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/promises')}
                    disabled={isSubmitting}
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
